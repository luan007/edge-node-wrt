var child_process = require('child_process');
var noble:any = require('noble');
import events = require("events");

export var Emitter = new events.EventEmitter();
export var Noble = noble;

var auto_start = true;
var devices:any = {};
var peripherals: any = {};

function hciconfig(dev, state, cb?:Callback){
    var ps = child_process.exec('hciconfig ' + dev + (state ? ' up' : ' down'), function(err){
        ps.kill();
        if(cb) cb();
        if(err) return console.log(err);
    });
}

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning([], true);
    } else if (state === 'poweredOn') {
        noble.stopScanning();
        if(auto_start)
            hciconfig(CONF.DEV.BLUETOOTH.DEV_HCI, true); // keep scanning always
    } else {
        trace("[NOBLE STATE]", state);
        noble.stopScanning();
    }
});

noble.on('forceChange', function(state){
    auto_start = state;
    if (auto_start === true) {
        noble.startScanning([], true);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function(peripheral) {
    setTask(peripheral.uuid, ()=>{ //TODO: clearTask(uuid) when connected to the uuid
        if(has(devices, peripheral.address))  delete devices[peripheral.address];
        if(has(peripherals, peripheral.address))  delete peripherals[peripheral.address];
        Emitter.emit("DOWN", peripheral.address);
    }, CONF.BLUETOOTH_MAXLIFE);

    if(has(devices, peripheral.address)){
        if(devices[peripheral.address].rssi !== peripheral.rssi) {
            devices[peripheral.address].rssi = peripheral.rssi;
            devices[peripheral.address].rssiStamp = new Date().getTime();
            Emitter.emit("CHANGE", peripheral.address, devices[peripheral.address]);
        }
    } else {
        peripherals[peripheral.address] = peripheral;
        devices[peripheral.address] = {
            uuid: peripheral.uuid,
            address: peripheral.address,
            addressType: peripheral.addressType,
            rssi: peripheral.rssi,
            rssiStamp: new Date().getTime(),
            name: peripheral.advertisement.localName,
            advertisedServices: peripheral.advertisement.serviceUuids,
            services: {},
            characteristics: {}
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
        peripheral.on('connect', function() {
            trace("[NOBLE CONNECT]", peripheral.address, peripheral.advertisement.localName);
            peripheral.discoverAllServicesAndCharacteristics ((err, services, characteristics)=>{
                var jobs = [];
                if(err) return error(err);
                for(var i in services){
                    devices[peripheral.address].services[services[i].uuid] = {
                        name: services[i].name,
                        properties:  services[i].properties,
                        type: services[i].type
                    };
                }
                for(var i in characteristics){
                    devices[peripheral.address].characteristics[characteristics[i].uuid] = {
                        name: characteristics[i].name,
                        properties: characteristics[i].properties,
                        value: []
                    };
                    if(characteristics[i].name && characteristics[i].read && characteristics[i].read instanceof Function){
                        (function(j){
                            jobs.push((cb)=>{
                                characteristics[j].read(function(err, result){
                                    if(result)
                                        devices[peripheral.address].characteristics[characteristics[j].uuid].value = JSON.stringify(result);
                                    return cb();
                                });
                            });
                        })(i);
                    }
                }
                async.series(jobs, ()=>{
                    Emitter.emit("UP", peripheral.address, devices[peripheral.address]);
                    peripheral.disconnect();
                });
            });
        });
        peripheral.on('disconnect', function() {
            trace("[NOBLE DISCONNECT]", peripheral.address, peripheral.advertisement.localName);
        });
        peripheral.on('rssiUpdate', function(rssi) {
            devices[peripheral.address].rssi = rssi;
        });

        peripheral.connect();
    }
});

