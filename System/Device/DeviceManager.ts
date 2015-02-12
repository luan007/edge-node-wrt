import Node = require("Node");
import Core = require("Core");
import Bus = require("./Bus/_Export");
import deviceTable = Core.Data.Tables.Device;
import deviceData = Core.Data.IDevice;
import deviceObj = Core.Data.Device;
import DriverManager = require("./DriverManager");

var devices: IDic<IDevice> = {};
var db_devices: IDic<deviceData> = {};
var hwaddr_map: IDic<KVSet> = {}; // <Bus<HWAddr>>
var device_updates: KVSet = {};

var not_saved = false;

function LoadFromDB(callback: Callback) {
    trace("Resuming from DB");
    deviceTable().all({}, (err, devs: deviceData[]) => {
        var total = 0;
        devices = {};
        if (devs) {
            for (var i = 0; i < devs.length; i++) {
                var dev = devs[i];
                if (!devices[dev.uid]) {
                    info(" + " + dev.hwaddr.bold + " - " + dev.busname.cyan);
                    var d = <IDevice>{
                        assumptions: dev.assumptions,
                        bus: {
                            data: dev.busdata,
                            hwaddr: dev.hwaddr,
                            name: dev.busname
                        },
                        id: dev.uid,
                        state: dev.state,
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

                } else {
                    fatal(" X " + dev.hwaddr.bold + " - " + dev.busname.cyan); //SKIP
                }
            }
        }
        trace((total + "").bold + " LOADED");
        callback(null, null);
    });
}

function SaveToDB(callback: Callback) {

    //log("Saving to DB");
    var pass = 0;
    var skip = 0;
    var fail = 0;

    var jobs = [];
    for (var id in devices) {
        (function (id) {
            if (!has(devices, id))
                return;
            var dev = devices[id];
            //SAVE
            var DBDEV = db_devices[id];
            if (!DBDEV) {
                //CREATE
                var devtmp = new deviceObj();
                devtmp.hwaddr = dev.bus.hwaddr;
                devtmp.time = dev.time;
                devtmp.busdata = dev.bus.data;
                devtmp.busname = dev.bus.name;
                devtmp.state = dev.state;
                devtmp.assumptions = dev.assumptions;
                devtmp.uid = dev.id;
                (function (id, devtmp) { // closure
                    jobs.push((cb) => {
                        trace("CREATE DBENTRY " + id);
                        deviceTable().create(devtmp, (err, DBDEV) => {
                            device_updates[id] = 0;
                            if (!err) {
                                db_devices[id] = DBDEV;
                                pass++;
                            } else {
                                error(err, "FAIL TO CREATE " + id);
                                fail++;
                            }
                            cb();
                        });
                    });
                })(id, devtmp);
            } else {
                //UPDATE
                if (!device_updates[id] || device_updates[id] === 0) {
                    skip++;
                } else {
                    (function (id, DBDEV) { // closure
                        jobs.push((cb) => {

                            var DBDEV = db_devices[id];
                            DBDEV.time = dev.time;
                            DBDEV.hwaddr = dev.bus.hwaddr;
                            DBDEV.time = dev.time;
                            DBDEV.busdata = dev.bus.data;
                            DBDEV.busname = dev.bus.name;
                            DBDEV.state = dev.state;
                            DBDEV.assumptions = dev.assumptions;

                            DBDEV.save({}, (err) => {
                                if (!err) {
                                    device_updates[id] = 0;
                                    pass++;
                                } else {
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
    async.series(jobs, () => {
        info((pass + "")["greenBG"].bold + " SAVE " + (skip + "")["cyanBG"].bold + " SKIP " + (fail + "")["redBG"].bold + " FAIL");
        return callback();
    });
}

function _patrolThread() {
    if (not_saved) {
        fatal(" PATROL ".bold["magentaBG"]);
        SaveToDB(() => {
            info("DONE");
        });
        not_saved = false;
    }
}

function _OnDevice(bus: IBusData) {
    //check device status

    if (!hwaddr_map[bus.name]) hwaddr_map[bus.name] = {};
    var devId = hwaddr_map[bus.name][bus.hwaddr];
    //TODO: Re-evaluate [prev]
    //var prev = undefined;
    var dev: IDevice;
    if (devId && devices[devId]) {
        //trace("Change : " + devId);
        dev = devices[devId];
        if (!dev.bus.data) {
            dev.bus.data = {}; //corrupt data :[!!!!
        }

        if (dev.state == 1 && _.isEqual(dev.bus.data, bus.data)) {
            warn("OnDevice found no change, Skipped");
            return;
        }
        
        //prev = JSON.parse(JSON.stringify(devices[devId]));
        delta_add(dev.bus.data, bus.data, true);
        dev.time = new Date();
        //log(" Loading DB " + dev.uid.bold);
        if (dev.state == 0) {
            dev.state = 1;
        }
        else {
            //ACTIVATED
        }
    } else {
        dev = <IDevice>{
            bus: bus,
            assumptions: {},
            id: UUIDstr(),
            time: new Date(),
            state: 1
        };
        trace(" Created " + dev.id.bold);
        devices[dev.id] = dev;
        if (!hwaddr_map[bus.name]) hwaddr_map[bus.name] = {};
        hwaddr_map[bus.name][bus.hwaddr] = dev.id;
    }
    device_updates[devId] = 1;
    DriverManager.DeviceChange(dev, undefined);
    not_saved = true;
}

function _ondriverchange(dev: IDevice) {
    device_updates[dev.id] = 1;
    not_saved = true;
}

function _OnDrop(bus: IBusData) {

    if (!hwaddr_map[bus.name]) hwaddr_map[bus.name] = {};
    var devId = hwaddr_map[bus.name][bus.hwaddr];

    if (devId) {
        var dev: IDevice = devices[devId];
        dev.state = 0;
        dev.time = new Date();
        DriverManager.DeviceDrop(dev);
        not_saved = true;
    } else {
        warn("DEVICE NOT FOUND");
    }
}

export var Buses: IDic<IBus> = {
    //Dummy: new Bus.Dummy()
    WLAN: undefined
};

function _initialize_buses(callback: Callback) {

    Buses["WLAN"] = new Bus.Wifi({
        "2G4": Core.Connectivity.Wifi.WLAN_2G4,
        "5G7": Core.Connectivity.Wifi.WLAN_5G7
    });
    
    for (var i in Buses) {
        Buses[i].on("device", _OnDevice);
        Buses[i].on("drop", _OnDrop);
    }

    async.series([Buses["WLAN"].start], callback);
    //callback();
}

export function Initialize(callback: Callback) {
    trace("Init..");
    LoadFromDB(() => {
        trace("Starting Patrol Thread - " + (CONF.DEVICE_SAVE_INTERVAL + "").bold["cyanBG"]);
        setJob("DEVDB", _patrolThread, CONF.DEVICE_SAVE_INTERVAL);
        DriverManager.Events.on("change", _ondriverchange);
        info("UP");
        _initialize_buses(callback);
    });
}

export function Devices() {
    return devices;
}

export function Get(id) {
    return devices[id];
}

export function FromBus(hwaddr, bus) : IDevice {
    if (hwaddr_map[bus] && hwaddr_map[bus][hwaddr]) {
        return devices[hwaddr_map[bus][hwaddr]];
    }
    return undefined;
}

export function GetDevIdByHWAddr(mac): string {
    mac = ("" + mac).toLowerCase();
    for (var busName in hwaddr_map) {
        if (has(hwaddr_map[busName], mac)) {
            return hwaddr_map[busName][mac];
        }
    }
    return undefined;
}

export function OrbitSync(devId, cb) {
    if (!has(db_devices, devId)) {
        process.nextTick(cb.bind(null, new Error("Device not found")));
    }
    Orbit.Post("Device", Orbit.PKG(undefined, devId, {
        busname: db_devices[devId].busname,
        hwaddr: db_devices[devId].hwaddr
    }), cb);
}