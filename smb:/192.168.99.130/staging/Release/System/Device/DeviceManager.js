var Node = require("Node");
var Core = require("Core");
var Bus = require("./Bus/_Export");
var deviceTable = Core.Data.Tables.Device;
var deviceObj = Core.Data.Device;
var DriverManager = require("./DriverManager");
var devices = {};
var db_devices = {};
var hwaddr_map = {};
var device_updates = {};
exports.Events = new Node.events.EventEmitter();
var not_saved = false;
function LoadFromDB(callback) {
    trace("Resuming from DB");
    deviceTable().all({}, function (err, devs) {
        var total = 0;
        devices = {};
        if (devs) {
            for (var i = 0; i < devs.length; i++) {
                var dev = devs[i];
                if (!devices[dev.uid] && dev.hwaddr) {
                    info(" + " + dev.uid.bold + " - " + dev.busname.cyan);
                    var d = {
                        assumptions: dev.assumptions,
                        bus: {
                            data: dev.busdata,
                            hwaddr: dev.hwaddr,
                            name: dev.busname
                        },
                        owner: dev.ownership,
                        config: dev.config,
                        id: dev.uid,
                        state: 0,
                        time: dev.time
                    };
                    total++;
                    devices[dev.uid] = d;
                    db_devices[dev.uid] = dev;
                    if (!hwaddr_map[dev.busname]) {
                        hwaddr_map[dev.busname] = {};
                    }
                    device_updates[dev.uid] = 0;
                    hwaddr_map[dev.busname][dev.hwaddr] = dev.uid;
                }
                else {
                    fatal(" X " + dev.uid + " - " + dev.busname.cyan);
                    dev.remove(function () {
                        fatal(' -REMOVED- ');
                    });
                }
            }
        }
        trace((total + "").bold + " LOADED");
        callback(null, null);
    });
}
function SaveToDB(callback) {
    var pass = 0;
    var skip = 0;
    var fail = 0;
    var jobs = [];
    for (var id in devices) {
        (function (id) {
            if (!has(devices, id) || !devices[id].bus.hwaddr)
                return;
            var dev = devices[id];
            var DBDEV = db_devices[id];
            if (!DBDEV) {
                var devtmp = new deviceObj();
                devtmp.hwaddr = dev.bus.hwaddr;
                devtmp.time = dev.time;
                devtmp.busdata = dev.bus.data;
                devtmp.ownership = dev.owner;
                devtmp.busname = dev.bus.name;
                devtmp.state = dev.state;
                devtmp.assumptions = dev.assumptions;
                devtmp.uid = dev.id;
                devtmp.config = dev.config;
                (function (id, devtmp) {
                    jobs.push(function (cb) {
                        trace("CREATE DBENTRY " + id);
                        deviceTable().create(devtmp, function (err, DBDEV) {
                            device_updates[id] = 0;
                            if (!err) {
                                db_devices[id] = DBDEV;
                                pass++;
                            }
                            else {
                                error(err, "FAIL TO CREATE " + id);
                                fail++;
                            }
                            cb();
                        });
                    });
                })(id, devtmp);
            }
            else {
                if (!device_updates[id] || device_updates[id] === 0) {
                    skip++;
                }
                else {
                    (function (id, DBDEV) {
                        jobs.push(function (cb) {
                            var DBDEV = db_devices[id];
                            DBDEV.time = dev.time;
                            DBDEV.hwaddr = dev.bus.hwaddr;
                            DBDEV.ownership = dev.owner;
                            DBDEV.time = dev.time;
                            DBDEV.busdata = dev.bus.data;
                            DBDEV.busname = dev.bus.name;
                            DBDEV.state = dev.state;
                            DBDEV.assumptions = dev.assumptions;
                            DBDEV.config = dev.config;
                            DBDEV.save({}, function (err) {
                                if (!err) {
                                    device_updates[id] = 0;
                                    pass++;
                                }
                                else {
                                    error(err, "FAIL TO UPDATE " + id);
                                    fail++;
                                }
                                cb();
                            });
                        });
                    })(id, DBDEV);
                }
            }
        })(id);
    }
    if (jobs.length == 0) {
        info((pass + "")["greenBG"].bold + " SAVE " + (skip + "")["cyanBG"].bold + " SKIP " + (fail + "")["redBG"].bold + " FAIL");
        return callback();
    }
    async.series(jobs, function () {
        info((pass + "")["greenBG"].bold + " SAVE " + (skip + "")["cyanBG"].bold + " SKIP " + (fail + "")["redBG"].bold + " FAIL");
        return callback();
    });
}
function _patrolThread() {
    if (not_saved) {
        fatal(" PATROL ".bold["magentaBG"]);
        SaveToDB(function () {
            info("DONE");
        });
        not_saved = false;
    }
}
function _OnDevice(bus) {
    var stateChange = false;
    if (!hwaddr_map[bus.name])
        hwaddr_map[bus.name] = {};
    var devId = hwaddr_map[bus.name][bus.hwaddr];
    var busDelta = {};
    var dev;
    if (devId && devices[devId]) {
        dev = devices[devId];
        if (!dev.bus.data) {
            dev.bus.data = {};
        }
        var change = delta_add_return_changes(dev.bus.data, JSON.parse(JSON.stringify(bus.data)), true);
        if (dev.state == 1 && Object.keys(change).length == 0) {
            warn(dev.bus + " - " + dev.bus.hwaddr + " OnDevice found no change, Skipped");
            return;
        }
        busDelta = change;
        dev.time = new Date();
        if (dev.state == 0) {
            stateChange = true;
            dev.state = 1;
        }
        else {
            stateChange = false;
        }
    }
    else {
        stateChange = true;
        dev = {
            bus: bus,
            assumptions: {},
            id: UUIDstr(),
            config: {},
            time: new Date(),
            state: 1,
            owner: ""
        };
        busDelta = bus;
        trace(" Created " + dev.id.bold);
        devices[dev.id] = dev;
        if (!hwaddr_map[bus.name])
            hwaddr_map[bus.name] = {};
        hwaddr_map[bus.name][bus.hwaddr] = dev.id;
    }
    __EMIT("Device.up", dev.id, dev);
    exports.Events.emit("up", dev.id, dev);
    device_updates[devId] = 1;
    DriverManager.DeviceChange(dev, undefined, undefined, busDelta, undefined, undefined, stateChange);
    not_saved = true;
}
function Config(dev, conf) {
    var devId = hwaddr_map[dev.bus.name][dev.bus.hwaddr];
    var dev;
    if (devId && devices[devId]) {
        dev = devices[devId];
        if (!dev.config) {
            dev.config = {};
        }
        var dt = delta_add_return_changes(dev.config, JSON.parse(JSON.stringify(conf)), true);
        if (Object.keys(dt).length == 0) {
            warn("Config Found No Change, Skipped");
            return;
        }
        device_updates[devId] = 1;
        if (dev.state == 1) {
            DriverManager.DeviceChange(dev, undefined, undefined, undefined, dt, undefined);
        }
        not_saved = true;
    }
    else {
        warn("Device not found");
    }
}
exports.Config = Config;
function _ondriverchange(dev) {
    device_updates[dev.id] = 1;
    not_saved = true;
}
function _OnDrop(bus) {
    if (!hwaddr_map[bus.name])
        hwaddr_map[bus.name] = {};
    var devId = hwaddr_map[bus.name][bus.hwaddr];
    if (devId) {
        var dev = devices[devId];
        dev.state = 0;
        dev.time = new Date();
        var delta = delta_add_return_changes(dev.bus, bus, true);
        var d = undefined;
        if (Object.keys(delta).length !== 0) {
            d = delta;
        }
        DriverManager.DeviceDrop(dev, d);
        not_saved = true;
        __EMIT("Device.down", dev.id, dev);
        exports.Events.emit("down", dev.id, dev);
    }
    else {
        warn("DEVICE NOT FOUND");
    }
}
exports.Buses = {
    WLAN: undefined,
    BLUETOOTH: undefined
};
function _initialize_buses(callback) {
    exports.Buses["WLAN"] = new Bus.Wifi({
        "2G4": Core.Router.Phy.Wifi.WLAN_2G4,
        "5G7": Core.Router.Phy.Wifi.WLAN_5G7,
    });
    exports.Buses["BLUETOOTH"] = new Bus.Bluetooth(Core.Router.Phy.Bluetooth.BluezInstance);
    for (var i in exports.Buses) {
        exports.Buses[i].on("device", _OnDevice);
        exports.Buses[i].on("drop", _OnDrop);
    }
    async.series([
        exports.Buses["WLAN"].start,
        exports.Buses["BLUETOOTH"].start
    ], callback);
}
function Initialize(callback) {
    trace("Init..");
    LoadFromDB(function () {
        trace("Starting Patrol Thread - " + (CONF.DEVICE_SAVE_INTERVAL + "").bold["cyanBG"]);
        setJob("DEVDB", _patrolThread, CONF.DEVICE_SAVE_INTERVAL);
        DriverManager.Events.on("change", _ondriverchange);
        info("UP");
        _initialize_buses(callback);
    });
}
exports.Initialize = Initialize;
function Devices() {
    return devices;
}
exports.Devices = Devices;
function Get(id) {
    return devices[id];
}
exports.Get = Get;
function FromBus(hwaddr, bus) {
    if (hwaddr_map[bus] && hwaddr_map[bus][hwaddr]) {
        return devices[hwaddr_map[bus][hwaddr]];
    }
    return undefined;
}
exports.FromBus = FromBus;
function GetDevIdByHWAddr(mac) {
    mac = ("" + mac).toLowerCase();
    for (var busName in hwaddr_map) {
        if (has(hwaddr_map[busName], mac)) {
            return hwaddr_map[busName][mac];
        }
    }
    return undefined;
}
exports.GetDevIdByHWAddr = GetDevIdByHWAddr;
function OrbitSync(devId, cb) {
    if (!has(db_devices, devId)) {
        process.nextTick(cb.bind(null, new Error("Device not found")));
    }
    Orbit.Post("Device", Orbit.PKG(undefined, devId, {
        busname: db_devices[devId].busname,
        hwaddr: db_devices[devId].hwaddr
    }), cb);
}
exports.OrbitSync = OrbitSync;
function List(ops) {
    ops = ops || {};
    var bus = Object.keys(hwaddr_map);
    var owner = ops.owner;
    var state = ops.state;
    if (ops.bus) {
        if (typeof bus === "string") {
            bus = [ops.bus];
        }
        else if (Array.isArray(ops.bus)) {
            bus = ops.bus;
        }
    }
    var r = {};
    for (var i = 0; i < bus.length; i++) {
        var b = bus[i];
        if (!hwaddr_map[b])
            continue;
        for (var j in hwaddr_map[b]) {
            var devId = hwaddr_map[b][j];
            var dev = devices[devId];
            if (devId && dev && (state === undefined || state === dev.state) && (owner === undefined || owner === dev.owner)) {
                r[devId] = dev;
            }
        }
    }
    return r;
}
exports.List = List;
function SetOwnership(devId, ownership) {
    var dev;
    if (devId && devices[devId]) {
        trace("Setting Ownership of : " + devId + " TO " + ownership);
        dev = devices[devId];
        if (dev.owner === ownership) {
            warn("Ownership Found No Change, Skipped");
            return;
        }
        exports.Events.emit("transfer", dev.id, dev, ownership, dev.owner);
        dev.owner = ownership;
        device_updates[devId] = 1;
        if (dev.state == 1) {
            DriverManager.DeviceChange(dev, undefined, undefined, undefined, undefined, ownership);
        }
        not_saved = true;
    }
    else {
        warn("Device not found");
    }
}
exports.SetOwnership = SetOwnership;
__EVENT("Device.down", [4 /* DeviceAccess */]);
__EVENT("Device.up", [4 /* DeviceAccess */]);
__API(withCb(Get), "Device.Get", [4 /* DeviceAccess */]);
__API(withCb(GetDevIdByHWAddr), "Device.GetByMAC", [4 /* DeviceAccess */]);
__API(withCb(Devices), "Device.All", [4 /* DeviceAccess */]);
__API(withCb(List), "Device.List", [4 /* DeviceAccess */]);
__API(withCb(FromBus), "Device.FromBus", [4 /* DeviceAccess */]);
__API(withCb(Config), "Device.Config", [4 /* DeviceAccess */, 0 /* System */]);
__API(withCb(SetOwnership), "Device.SetOnwership", [4 /* DeviceAccess */, 0 /* System */]);
