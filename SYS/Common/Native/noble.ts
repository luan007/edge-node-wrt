var child_process = require('child_process');
var noble:any = require('noble');
import events = require("events");

export var Emitter = new events.EventEmitter();
export var Noble = noble;

var auto_start = true;
var devices:any = {};
var peripherals:any = {};

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
    } else if (state === 'poweredOn') {
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
        if (has(peripherals, peripheral.address))  delete peripherals[peripheral.address];
        Emitter.emit("DOWN", peripheral.address);
    }, CONF.BLUETOOTH_MAXLIFE);

    if (has(devices, peripheral.address)) {
        if (devices[peripheral.address].rssi !== peripheral.rssi) {
            devices[peripheral.address].rssi = peripheral.rssi;
            devices[peripheral.address].rssiStamp = new Date().getTime();
            Emitter.emit("CHANGE", peripheral.address, devices[peripheral.address]);
        }
    } else {
        peripherals[peripheral.address] = peripheral; //TODO: remove `random` addressType
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
            connected: false
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
            devices[peripheral.address].connected = true;
        });
        peripheral.on('disconnect', function () {
            //trace("[NOBLE DISCONNECT]", peripheral.address, peripheral.advertisement.localName);
            Emitter.emit('disconnect', peripheral.address);
            devices[peripheral.address].connected = false;
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

                peripherals[peripheral.address].services = {};

                for (var i in services) {
                    devices[peripheral.address].services[services[i].uuid] = {
                        name: services[i].name,
                        properties: services[i].properties,
                        type: services[i].type
                    };
                    //peripherals[peripheral.address].services[services[i].uuid] = services[i];
                }

                peripherals[peripheral.address].characteristics = {};

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
                    //peripherals[peripheral.address].characteristics[characteristics[i].uuid] = characteristics[i];
                }
                async.series(jobs, ()=> {
                    Emitter.emit("UP", peripheral.address, devices[peripheral.address]);
                    peripheral.disconnect();
                });
            });
        });
    }
});

export function Write(address:string, uuid:string, data, cb:Callback) {
    console.log(">>> Write");
    var perf:any = peripherals[address.toLowerCase()];
    if (perf) {
            if (!perf.characteristics) return cb(new Error("No connection"));
            if (perf.characteristics.length === 0) return cb(new Error("No such characteristic"));

            if(!Buffer.isBuffer(data))
                data = new Buffer(data);

            //perf.discoverSomeServicesAndCharacteristics([], [uuid], (err2, services, characteristics)=>{
            //    trace("characteristics", characteristics);
            //
            //    if (err2) {
            //        perf.disconnect();
            //        return cb(err2);
            //    }
            //    if(characteristics)
            //        characteristics[0].write(data, function (err3) {
            //            perf.disconnect();
            //            if (err3) return cb(err2);
            //            return cb();
            //        });
            //});

            trace("characteristics >>> ", uuid, perf.characteristics[uuid]);

            perf.characteristics[uuid].write(data, function (err2) {
                if (err2) return cb(err2);
                return cb();
            });

    } else {
        return cb(new Error("No such device"));
    }
}

export function Read(address:string, uuid:string, cb:Callback) {
    var perf:any = peripherals[address.toLowerCase()];
    if (perf) {
        if (!perf.characteristics) return cb(new Error("No connection"));
        if (perf.characteristics.length === 0) return cb(new Error("No such characteristic"));

        perf.characteristics[uuid].read(function (err2, result) {
            if (err2) return cb(err2);
            return cb(undefined, result);
        });
    }
    else {
        return cb(new Error("No such device"));
    }
}

export function Connect(address:string, cb){
    if(devices[address].connected === true)
        return cb(new Error("device was connected already."));
    var perf:any = peripherals[address.toLowerCase()];
    if (perf) {
        perf.connect((err)=>{
            console.log(">>> peripheral was connnectd");
            if (err) return cb(err);
            perf.discoverAllServicesAndCharacteristics((err2, services, characteristics)=> {
                console.log(">>> peripheral was disconvered", err2);
                if(err2) return cb(err2);
                for (var i in services) {
                    perf.services[services[i].uuid] = services[i];
                }
                for (var i in characteristics) {
                    perf.characteristics[characteristics[i].uuid] = characteristics[i];
                }
                return cb();
            });
        });
    } else {
        return cb(new Error("No such device"));
    }
}

export function Disconnect(address:string, cb?:Callback){
    if(devices[address].connected === false)
        return cb(new Error("device was not connected."));
    var perf:any = peripherals[address.toLowerCase()];
    if (perf) {
        perf.disconnect(cb);
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
