var child_process = require('child_process');
var noble:any = require('noble');
import events = require("events");

export var Emitter = new events.EventEmitter();
export var Noble = noble;

var auto_start = false;
var devices:any = {};
//var peripherals:any = {};

function hciconfig(dev, state, cb?:Callback) {
    var ps = child_process.exec('hciconfig ' + dev + (state ? ' up' : ' down'), function (err) {
        ps.kill();
        if (cb) cb();
        if (err) return console.log(err);
    });
}

noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
        noble.startScanning([], true);
    } else if (state === 'poweredOff') {
        noble.stopScanning();
        if (auto_start)
            hciconfig(CONF.DEV.BLUETOOTH.DEV_HCI, true); // keep scanning always
    } else {
        //trace("[NOBLE STATE]", state);
        noble.stopScanning();
    }
});

noble.on('forceChange', function (state) {
    auto_start = state;
    if (auto_start === true) {
        noble.startScanning([], true);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function (peripheral) {
    setTask(peripheral.address, ()=> {
        if (has(devices, peripheral.address))  delete devices[peripheral.address];
        //if (has(peripherals, peripheral.address))  delete peripherals[peripheral.address];
        Emitter.emit("DOWN", peripheral.address);
    }, CONF.BLUETOOTH_MAXLIFE);

    if (has(devices, peripheral.address)) {
        if (devices[peripheral.address].rssi !== peripheral.rssi) {
            devices[peripheral.address].rssi = peripheral.rssi;
            devices[peripheral.address].rssiStamp = new Date().getTime();
            Emitter.emit("CHANGE", peripheral.address, devices[peripheral.address]);
        }
    } else {
        //peripherals[peripheral.address] = peripheral; //TODO: remove `random` addressType
        devices[peripheral.address] = {
            uuid: peripheral.uuid,
            address: peripheral.address,
            addressType: peripheral.addressType,
            rssi: peripheral.rssi,
            rssiStamp: new Date().getTime(),
            name: peripheral.advertisement.localName,
            advertisedServices: peripheral.advertisement.serviceUuids,
            services: {},
            characteristics: {},
            //connected: false
        };

        var serviceData = peripheral.advertisement.serviceData;
        if (serviceData && serviceData.length) {
            devices[peripheral.address].serviceData = serviceData;
        }
        if (peripheral.advertisement.manufacturerData) {
            devices[peripheral.address].manufacturerData = peripheral.advertisement.manufacturerData.toString('hex');
        }
        if (peripheral.advertisement.txPowerLevel !== undefined) {
            devices[peripheral.address].txPowerLevel = peripheral.advertisement.txPowerLevel;
        }

        // ---------------- events ----------------
        peripheral.on('connect', function () {
            //trace("[NOBLE CONNECT]", peripheral.address, peripheral.advertisement.localName);
            clearTask(peripheral.address);
            Emitter.emit('connect', peripheral.address);
            //devices[peripheral.address].connected = true;
        });
        peripheral.on('disconnect', function () {
            //trace("[NOBLE DISCONNECT]", peripheral.address, peripheral.advertisement.localName);
            Emitter.emit('disconnect', peripheral.address);
            //devices[peripheral.address].connected = false;
        });
        peripheral.on('rssiUpdate', function (rssi) {
            devices[peripheral.address].rssi = rssi;
            devices[peripheral.address].rssiStamp = new Date().getTime();
        });

        peripheral.connect((err)=> {
            if (err) return error(err);
            peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics)=> {
                var jobs = [];
                if (err) return error(err);

                peripheral.services = {};

                for (var i in services) {
                    devices[peripheral.address].services[services[i].uuid] = {
                        name: services[i].name,
                        properties: services[i].properties,
                        type: services[i].type
                    };
                    peripheral.services[services[i].uuid] = services[i];
                }

                peripheral.characteristics = {};

                for (var i in characteristics) {
                    devices[peripheral.address].characteristics[characteristics[i].uuid] = {
                        name: characteristics[i].name,
                        properties: characteristics[i].properties,
                        value: []
                    };
                    if (characteristics[i].name && characteristics[i].read && characteristics[i].read instanceof Function) {
                        (function (j) {
                            jobs.push((cb)=> {
                                characteristics[j].read(function (err, result) {
                                    if (result)
                                        devices[peripheral.address].characteristics[characteristics[j].uuid].value = JSON.stringify(result);
                                    return cb();
                                });
                            });
                        })(i);
                    }
                    peripheral.characteristics[characteristics[i].uuid] = characteristics[i];
                }
                async.series(jobs, ()=> {
                    Emitter.emit("UP", peripheral.address, devices[peripheral.address]);
                    peripheral.disconnect();
                });
            });
        });
    }
});

function __getPerf(address:string) {
    var device = devices[address.toLowerCase()];
    if (device && device.uuid) {
        return noble._peripherals[device.uuid];
    }
    return undefined;
}

function __isConnected(perf) {
    return perf.state === "connected" || perf.state === 'connecting';
}

export function Write(address:string, uuid:string, data, cb:Callback) {
    console.log(">>> Write");

    var perf:any = __getPerf(address);
    if (perf) {
        if (!perf.characteristics || perf.state !== "connected") return cb(new Error("No connection"));
        if (!perf.characteristics[uuid]) return cb(new Error("No such characteristic"));

        if (!Buffer.isBuffer(data))
            data = new Buffer(data);

        //trace("characteristics >>> ", uuid, perf.characteristics[uuid]);
        //throttle this crap
        //  return intoQueue(address + "_cmd", (c) => {
        //      c = must(c, 300);
             console.log(">>> Actual Write");
             perf.characteristics[uuid].write(data, false, () => {
                 console.log(">>> Done Write");
                //  return cb();
             });
             
             cb();
        //  }
        //  ,cb);
    } else {
        return cb(new Error("No such device"));
    }
}

export function Read(address:string, uuid:string, cb:Callback) {
    var perf:any = __getPerf(address);
    if (perf) {
        if (!perf.characteristics) return cb(new Error("No connection"));
        if (perf.characteristics.length === 0) return cb(new Error("No such characteristic"));

        intoQueue(address + "_cmd", (cb)=> {
            perf.characteristics[uuid].read(function (err2, result) {
                if (err2) return cb(err2);
                return cb(undefined, result);
            });
        }, cb);
    } else {
        return cb(new Error("No such device"));
    }
}

export function Connect(address:string, cb) {
    intoQueue(address + "_cmd", (cb) => {
        cb = must(cb, 8000);
        var perf:any = __getPerf(address);
        if (perf) {
            if (__isConnected(perf))
                return cb();
            console.log("Connecting to Perf");
                console.log("Connecting .. to " + address);
                perf.connect((err)=> {
                    console.log(">>> peripheral was connnectd");
                    if (err) return cb(err);
                    perf.discoverAllServicesAndCharacteristics((err2, services, characteristics)=> {
                        console.log(">>> peripheral was discovered", err2);
                        if (err2) return cb(err2);
                        perf.services = {};
                        for (var i in services) {
                            perf.services[services[i].uuid] = services[i];
                        }
                        perf.characteristics = {};
                        for (var i in characteristics) {
                            perf.characteristics[characteristics[i].uuid] = characteristics[i];
                        }
                        return cb();
                    });
                });
        } else {
            return cb(new Error("No such device"));
        }
    }, cb);
}


export function Disconnect(address:string, cb:Callback) {
    var perf:any = __getPerf(address);
    if (perf) {
        if (__isConnected(perf))
            // return intoQueue(address + "_cmd", (cb)=> {
                perf.disconnect(cb);
            // }, cb);
        else
            return cb();
    } else {
        return cb(new Error("No such device"));
    }
}

export function RSSI(address:string) {
    if (devices[address])
        return {
            rssi: devices[address].rssi,
            rssiStamp: devices[address].rssiStamp
        };
    return undefined;
}
