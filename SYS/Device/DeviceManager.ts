import _device = require('../DB/Models/Device');
import deviceData = _device.IDevice;
import deviceObj = _device.Device;
var deviceTable = deviceObj.table;
import DriverManager = require("./DriverManager");
import StatMgr = require('../Common/Stat/StatMgr');
import events = require('events');

var devices:IDic<IDevice> = {};
var db_devices:IDic<deviceData> = {};
var hwaddr_map:IDic<KVSet> = {}; // <Bus<HWAddr>>
var device_updates:KVSet = {};

export var Events = new events.EventEmitter();

var not_saved = false;
var loaded = false;

function LoadFromDB(callback:Callback) {
    trace("Resuming from DB");
    deviceTable().all({}, (err, devs:deviceData[]) => {
        var total = 0;
        devices = {};
        if (devs) {
            for (var i = 0; i < devs.length; i++) {
                var dev = <any>devs[i];
                if (!devices[dev.uid] && dev.hwaddr) {
                    info(" + " + dev.uid.bold + " - " + dev.busname.cyan);
                    var d = <IDevice>{
                        assumptions: JSON.parse(dev.assumptions),
                        bus: {
                            data: JSON.parse(dev.busdata),
                            hwaddr: dev.hwaddr,
                            name: dev.busname
                        },
                        owner: dev.ownership,
                        config: JSON.parse(dev.config),
                        id: dev.uid,
                        //state: dev.state,
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

                } else {
                    fatal(" X " + dev.uid + " - " + dev.busname.cyan); //SKIP
                    //and remove it
                    dev.remove(() => {
                        fatal(' -REMOVED- ');
                    });
                }
            }
        }
        info((total + "").bold + " LOADED");
        loaded = true;
        callback(null, null);
    });
}

function SaveToDB(callback:Callback) {

    //log("Saving to DB");
    var pass = 0;
    var skip = 0;
    var fail = 0;

    var jobs = [];
    for (var id in devices) {
        (function (id) {
            if (!has(devices, id) || !devices[id].bus.hwaddr)
                return;
            var dev = devices[id];
            //SAVE
            var DBDEV = db_devices[id];
            if (!DBDEV) {
                //CREATE
                var devtmp = new deviceObj();
                devtmp.hwaddr = dev.bus.hwaddr;
                devtmp.time = dev.time;
                devtmp.busdata = JSON.stringify(dev.bus.data);
                devtmp.ownership = dev.owner;
                devtmp.busname = dev.bus.name;
                devtmp.state = dev.state;
                devtmp.assumptions = JSON.stringify(dev.assumptions);
                devtmp.uid = dev.id;
                devtmp.config = JSON.stringify(dev.config);
                (function (id, devtmp) { // closure
                    jobs.push((cb) => {
                        trace("CREATE DBENTRY " + id);
                        deviceTable().create(devtmp, (err, DBDEV) => {
                            //if (devtmp.hwaddr === '1c:3e:84:8b:c5:71') {
                            //    console.log('ipp printer into DB', devtmp.assumptions);
                            //}
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
                    (function (id) { // closure
                        jobs.push((cb) => {
                            var dbDev = db_devices[id];
                            var devInMemory = devices[id];

                            if (dbDev) {
                                dbDev.time = devInMemory.time;
                                dbDev.hwaddr = devInMemory.bus.hwaddr;
                                dbDev.ownership = devInMemory.owner;
                                dbDev.time = devInMemory.time;
                                dbDev.busdata = JSON.stringify(devInMemory.bus.data);
                                dbDev.busname = devInMemory.bus.name;
                                dbDev.state = devInMemory.state;
                                dbDev.assumptions = JSON.stringify(devInMemory.assumptions);
                                dbDev.config = JSON.stringify(devInMemory.config);
                                dbDev.save({}, (err) => {
                                    //if (dbDev.hwaddr === '1c:3e:84:8b:c5:71') {
                                    //    console.log('ipp printer into DB', dbDev.assumptions);
                                    //}
                                    if (!err) {
                                        device_updates[id] = 0;
                                        pass++;
                                    } else {
                                        error(err, "FAIL TO UPDATE " + id);
                                        fail++;
                                    }
                                    cb();
                                });
                            }
                        });
                    })(id);
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
        info(" device manager save DB PATROL ".bold["magentaBG"]);
        SaveToDB(() => {
            info("DONE");
        });
        not_saved = false;
    }
}

//function isP0F(bus) {
//    return bus && bus.hwaddr && bus.hwaddr === '60:d9:c7:41:d4:71' && bus.data.P0F && Object.keys(bus.data.P0F).length > 0;
//}

function _OnDevice(bus:IBusData, state) {
    //check device status

    var stateChange = false;
    if (!hwaddr_map[bus.name]) hwaddr_map[bus.name] = {};
    var devId = hwaddr_map[bus.name][bus.hwaddr];
    //if (isP0F(bus))
    //    console.log('1. _onDevice <<< ==========', devId, bus.data.P0F);
    //TODO: Re-evaluate [prev]
    //var prev = undefined;
    var busDelta = {};
    var dev:IDevice;
    if (devId && devices[devId]) {
        //trace("Change : " + devId);
        dev = devices[devId];
        if (!dev.bus.data) {
            dev.bus.data = {}; //corrupt data :[!!!!
        }
        //bug fixed
        warn('bus data', bus.name, bus.data);
        var change = delta_add_return_changes(dev.bus.data, JSON.parse(JSON.stringify(bus.data)), true);
        if (dev.state == 1 && Object.keys(change).length == 0) {
            warn(dev.bus + " - " + dev.bus.hwaddr + " OnDevice found no change, Skipped");
            return;
        }
        //if (isP0F(bus))
        //    console.log('2. _onDevice <<< ==========', dev.state, state, '\n dev.bus.data:', dev.bus.data, '\n change:', change);
        busDelta = {
            data: change,
            hwaddr: bus.hwaddr,
            name: bus.name
        };
        //log(" Loading DB " + dev.uid.bold);
        if (dev.state == 0 && state) {
            stateChange = true;
            dev.state = 1;
            dev.time = new Date();
        }
        else {
            //ACTIVATED
            stateChange = false;
        }
    } else {
        stateChange = state;
        dev = <IDevice>{
            bus: bus,
            assumptions: {},
            id: UUIDstr(),
            config: {},
            time: new Date(),
            state: state ? 1 : 0,
            owner: ""
        };
        busDelta = bus;
        trace(" Created " + dev.id.bold);
        devices[dev.id] = dev;
        if (!hwaddr_map[bus.name]) hwaddr_map[bus.name] = {};
        hwaddr_map[bus.name][bus.hwaddr] = dev.id;
    }
    __EMIT("Device.up", dev.id, dev);
    Events.emit("up", dev.id, dev);
    device_updates[devId] = 1;
    DriverManager.DeviceChange(dev, undefined, undefined, busDelta, undefined, undefined, stateChange);
    not_saved = true;
}

export function Config(dev:IDevice, conf:any) {

    var devId = hwaddr_map[dev.bus.name][dev.bus.hwaddr];
    //TODO: Re-evaluate [prev]
    //var prev = undefined;
    var dev:IDevice;
    if (devId && devices[devId]) {
        //trace("Change : " + devId);
        dev = devices[devId];
        if (!dev.config) {
            dev.config = {}; //corrupt data :[!!!!
        }

        var dt = delta_add_return_changes(dev.config, JSON.parse(JSON.stringify(conf)), true);
        if (Object.keys(dt).length == 0) {
            warn("Config Found No Change, Skipped");
            return;
        }
        //prev = JSON.parse(JSON.stringify(devices[devId]));

        device_updates[devId] = 1;
        if (dev.state == 1) {
            DriverManager.DeviceChange(dev, undefined, undefined, undefined, dt, undefined);
            //Only update when alive
        }
        not_saved = true;
    }
    else {
        warn("Device not found");
    }

}

function _ondriverchange(dev:IDevice, drv:IDriver, assump:IDeviceAssumption) {
    device_updates[dev.id] = 1;
    if (assump) {
        //if (assump.driverId === 'App_DriverApp:P0F') {
        //    console.log('4.5  _ondriverchange  <<< ==========', assump);
        //}


        if (!devices[dev.id].assumptions) devices[dev.id].assumptions = {};
        delta_add_return_changes(devices[dev.id].assumptions[drv.id()], assump, true);

        //devices[dev.id].assumptions[drv.id()] = assump;
    }
    not_saved = true;
}

function _OnDrop(bus:IBusData) {

    if (!hwaddr_map[bus.name]) hwaddr_map[bus.name] = {};
    var devId = hwaddr_map[bus.name][bus.hwaddr];
    if (devId) {
        var dev:IDevice = devices[devId];
        if (dev) {
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
            Events.emit("down", dev.id, dev);
        }
    } else {
        warn("DEVICE NOT FOUND");
    }


}

export function Initialize(cb) {
    trace("Init..");
    LoadFromDB(() => {
        trace("Starting Patrol Thread - " + (CONF.DEVICE_SAVE_INTERVAL + "").bold["cyanBG"]);
        setJob("DEVDB", _patrolThread, CONF.DEVICE_SAVE_INTERVAL);
        DriverManager.Events.on("change", _ondriverchange);
        info("UP");
        cb();
    });
}

export function Diagnose(callback:Callback) {
    if (!loaded) return callback(new Error('Device loading failed.'), false);
    return callback(null, true);
}

export function RegisterBus(bus) {
    bus.on('device', _OnDevice);
    bus.on('drop', _OnDrop);
}

export function Devices() {
    return devices;
}

export function Get(id) {
    return devices[id];
}

export function FromBus(hwaddr, bus):IDevice {
    if (hwaddr_map[bus] && hwaddr_map[bus][hwaddr]) {
        return devices[hwaddr_map[bus][hwaddr]];
    }
    return undefined;
}

export function GetDevIdByHWAddr(mac):string {
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
        fatal('==========<< devId', devId);
        process.nextTick(cb.bind(null, new Error("Device not found")));
    }
    Orbit.Post("Device", Orbit.PKG(undefined, devId, {
        busname: db_devices[devId].busname,
        hwaddr: db_devices[devId].hwaddr
    }), cb);
}

export function List(ops:{
    state?: number;
    bus?: string | string[];
    owner?: string
}) {

    ops = ops || {};

    var bus = Object.keys(hwaddr_map); //default
    var owner = ops.owner;
    var state = ops.state;
    if (ops.bus) {
        if (typeof bus === "string") {
            bus = <any>[ops.bus];
        } else if (Array.isArray(ops.bus)) {
            bus = <any>ops.bus;
        }
    }
    var r = {};
    for (var i = 0; i < bus.length; i++) {
        var b = bus[i];
        if (!hwaddr_map[b]) continue;
        for (var j in hwaddr_map[b]) {
            var devId = hwaddr_map[b][j];
            var dev = devices[devId];
            if (devId && dev
                && (state === undefined || state === dev.state)
                && (owner === undefined || owner === dev.owner)) {
                r[devId] = dev;
            }
        }
    }
    return r;

}

export function SetOwnership(devId, ownership) {

    var dev:IDevice;
    if (devId && devices[devId]) {
        trace("Setting Ownership of : " + devId + " TO " + ownership);
        dev = devices[devId];
        if (dev.owner === ownership) {
            warn("Ownership Found No Change, Skipped");
            return;
        }

        Events.emit("transfer", dev.id, dev, ownership, dev.owner);

        dev.owner = ownership;
        device_updates[devId] = 1;
        if (dev.state == 1) {
            DriverManager.DeviceChange(dev, undefined, undefined, undefined, undefined, ownership);
            //Only update when alive
        }
        not_saved = true;
    }
    else {
        warn("Device not found");
    }
}


__EVENT("Device.down", [Permission.DeviceAccess]);
__EVENT("Device.up", [Permission.DeviceAccess]);

__API(withCb(Get), "Device.Get", [Permission.DeviceAccess]);
__API(withCb(GetDevIdByHWAddr), "Device.GetByMAC", [Permission.DeviceAccess]);
__API(withCb(Devices), "Device.All", [Permission.DeviceAccess]);
__API(withCb(List), "Device.List", [Permission.DeviceAccess]);
__API(withCb(FromBus), "Device.FromBus", [Permission.DeviceAccess]);
__API(withCb(Config), "Device.Config", [Permission.DeviceAccess, Permission.System]);
__API(withCb(SetOwnership), "Device.SetOnwership", [Permission.DeviceAccess, Permission.System]);