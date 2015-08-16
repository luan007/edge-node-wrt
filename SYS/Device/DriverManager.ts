eval(LOG("Device:DriverManager"));

/*TODO: This is so broken, total destruction IS needed*/
import DeviceManager = require('./DeviceManager');
import DB = require('./Graphd/DB');
import events = require('events');
import StatBiz = require('../Common/Stat/StatBiz');

import RuntimePool = require('../APP/RuntimePool');

var Drivers: IDic<IDriver> = {};
var Drivers_BusMapping: IDic<IDic<IDriver>> = {};
var InterestCache = {};

export var Events = new events.EventEmitter();

var query = require("underscore-query")(_);

export function InvalidateDrvInterest(drvId) {
    //TODO: swap to pursuit if you want..
    delete InterestCache[drvId];
}

export function ForceProbe(drv: IDriver) {
    var devs = DeviceManager.Devices();
    var buses = drv.bus();
    for (var q in devs) {
        if (buses.indexOf(devs[q].bus.name) > -1 && devs[q].state > 0) {
            _notify_driver(drv, devs[q], {
                depth: 1,
                root: drv.id(),
                parent: undefined
            }, undefined, undefined, undefined, undefined, true); //fixing 'slow resp driver' prob
        }
    }
}

export function ForceProbeAll() {
    setTask("FORCEPROBE", ()=>{
        trace("Force Probing...");
        var drvs = Drivers;
        for(var i in drvs){
            ForceProbe(drvs[i]);
        }
    }, 1000);
}

export function LoadDriver(drv: IDriver, cb) {
    if (drv /* && !has(Drivers, drv.id())*/) {
        var reload = false;
        if (!has(Drivers, drv.id())) {
            info("Loading Driver " + drv.name().bold + " to BUS(es) " + ('' + JSON.stringify(drv.bus())).bold);
        } else {
            reload = true;
            info("Reloading Driver " + drv.name().bold + " to BUS(es) " + ('' + JSON.stringify(drv.bus())).bold);
        }
        drv.load((err) => {
            var drvId = drv.id();
            var buses = drv.bus();
            Drivers[drvId] = drv;
            //PursuitCache[drvId] = {};
            for (var i = 0; i < buses.length; i++) {
                var busName = buses[i];
                if (has(Drivers_BusMapping[busName], drvId)) {
                    Drivers_BusMapping[busName][drvId] = undefined; //cleanup
                }
            }
            for (var i = 0; i < buses.length; i++) {
                if (!Drivers_BusMapping[buses[i]]) Drivers_BusMapping[buses[i]] = {};
                Drivers_BusMapping[buses[i]][drvId] = drv;
            }
            //Dovvn't care..
            info("UP - " + drv.name().bold);
            if (reload) {
                __EMIT("Driver.reload", drv.id());
            } else {
                __EMIT("Driver.up", drv.id());
            }
            
            ForceProbe(drv);

            cb(err);
        });
    }
}

interface _tracker {
    depth: number;
    parent?: string;
    root?: string;
}

function _sanity_check(ver, dev: IDevice, drv: IDriver, err = false) {
    return drv.status() && dev.time.getTime() - ver == 0 && !err;
}

function _assumption_check(delta: IDeviceAssumption, callback: Callback) {
    if (delta) {
        var jobs = [];
        jobs.push((cb) => { // check for class
            DB.QueryType(0, (err, classes) => {
                if (err) return cb(err);
                else {
                    for (var klass in delta.classes) { // key only
                        if (!classes.hasOwnProperty(klass)) {
                            return cb(new Error('Illegal class assumption: ' + klass));
                        }
                    }
                    return cb();
                }
            });
        });
        jobs.push((cb) => { // check for action
            DB.QueryType(2, (err, actions) => {
                if (err) return cb(err);
                else {
                    for (var action in delta.actions) { // key only
                        if (!actions.hasOwnProperty(action))
                            return cb(new Error('Illegal action assumption: ' + action));
                    }
                    return cb();
                }
            });
        });
        jobs.push((cb) => { // check for attribute
            DB.QueryType(1, (err, attributes) => {
                if (err) return cb(err);
                else {
                    for (var attr in delta.attributes) { // verify k & v both
                        if (!attributes.hasOwnProperty(attr))
                            return cb(new Error('Illegal attribute assumption: ' + attr));
                        else if (attributes[attr].datatype
                            && attributes[attr].datatype !== typeof delta.attributes[attr]
                            && 'string' !== typeof delta.attributes[attr]) // string ~= Array['', '']
                            return cb(new Error('wrong attribute data type: ' + attr
                                + ', actual is :' + typeof delta.attributes[attr]
                                + ' , value:' + delta.attributes[attr]));
                    }
                    return cb();
                }
            });
        });
        async.series(jobs, callback);
    } else {
        return callback(new Error('corrupted assumption :(')); // will not be happen
    }
}

function _update_driver_data(drv: IDriver, dev: IDevice, assump: IDeviceAssumption, tracker: _tracker) {
    if (!drv || !drv.status() || !dev || !Drivers[drv.id()]) return;
    _assumption_check(assump, (err) => {
        if (err) {
            DB.GraphdUpdateTask((err) => {
                if (err) return error(err);
                return trace("graphd SYNC DONE.");
            }, 1000);
            return console.log(err.message['red']);

        } else {
            var real: IDeviceAssumption = <any>{};
            var changed = false;

            for (var i in assump) {
                switch (i) {
                    case "aux":
                        real.aux = assump.aux;
                        changed = true;
                        break;
                    case "attributes":
                        if (_.isObject(assump.attributes) && !_.isArray(assump.attributes)) {
                            real.attributes = assump.attributes;
                            changed = true;
                        }
                        break;
                    case "classes":
                        if (_.isObject(assump.classes) && !_.isArray(assump.classes)) {
                            real.classes = assump.classes;
                            changed = true;
                        }
                        break;
                    case "actions":
                        if (_.isObject(assump.actions) && !_.isArray(assump.actions)) {
                            real.actions = assump.actions;
                            changed = true;
                        }
                        break;
                    case "valid":
                        if (_.isBoolean(assump.valid)) {
                            real.valid = assump.valid;
                            changed = true;
                        }
                        break;
                }
            }
            if (!changed) {
                warn("Empty / Malformed Assumption - Skipped");
                return;
            }
            real.driverId = drv.id(); //make sure
            var curAssump = dev.assumptions[real.driverId];
            if (_.isEqual(curAssump, real)) {
                warn("Exact-Same Assumption - Skipped");
                return;
            }

            var delta = Object.create(null);
            if (curAssump) {
                delta = delta_add_return_changes(curAssump, real, true);
            }
            else {
                dev.assumptions[real.driverId] = real;
                //default value
                real.actions = real.actions ? real.actions : {};
                real.classes = real.classes ? real.classes : {};
                real.aux = real.aux ? real.aux : undefined;
                real.valid = real.valid ? real.valid : false;
                real.attributes = real.attributes ? real.attributes : {};
                delta = real;
            }

            if (Object.keys(delta).length == 0) {
                return; //skippedd
            }

            Events.emit("change", dev, drv, delta);

            var ntracker = {
                depth: tracker.depth + 1,
                parent: real.driverId,
                root: tracker.root
            };
            process.nextTick(() => {
                DeviceChange(dev, ntracker, delta, undefined, undefined, undefined);
            });
        }
    });
}

export function DriverActiveUpdate(drv: IDriver, dev: IDevice, assump: IDeviceAssumption) {
    _update_driver_data(drv, dev, assump, {
        depth: 1, root: drv.id()
    });
}


function _notify_driver(driver: IDriver, dev: IDevice, tracker: _tracker, delta: IDeviceAssumption, deltaBus: IBusData, deltaConf: KVSet, deltaOwn, stateChange?) {
    process.nextTick(() => {

        if(!driver.bus() || driver.bus().indexOf(dev.bus.name) < 0 ) return; //WHO DA FOCK?

        var drvId = driver.id();
        var version = dev.time.getTime();
        var myAssump = dev.assumptions[drvId];

        if (!_sanity_check(version, dev, driver)) return; //WTF??

        try {
            if (myAssump && myAssump.valid && _is_interested_in(driver, dev, 1, tracker, delta, deltaBus, deltaConf, deltaOwn, stateChange)) {
                //need change
                driver.change(dev, {
                    assumption: delta,
                    bus: deltaBus,
                    config: deltaConf,
                    ownership: deltaOwn
                }, <any>once((err, assump) => {
                    if (!assump || !_sanity_check(version, dev, driver, err)) return;
                    _update_driver_data(driver, dev, assump, tracker);
                }));
            } else if (!(myAssump && myAssump.valid) && _is_interested_in(driver, dev, 0, tracker, delta, deltaBus, deltaConf, deltaOwn, stateChange)) {
                //TODO: Verify EmitterizeCB's impact/influence on GC, to see if it solves the 'ghost CB' prob
                driver.match(dev, {
                    assumption: delta,
                    bus: deltaBus,
                    config: deltaConf,
                    ownership: deltaOwn
                }, <any>must((err, data) => {
                    if (err) {
                        error(err);
                        error(err.stack);
                    }
                    if (!data || !_sanity_check(version, dev, driver, err)) return;
                    try {

                        driver.attach(dev, {
                            assumption: delta,
                            bus: deltaBus,
                            config: deltaConf,
                            ownership: deltaOwn
                        }, data, <any>once((err, assump) => {
                            if (!assump || !_sanity_check(version, dev, driver, err)) return;
                            _update_driver_data(driver, dev, assump, tracker);
                        }));
                    } catch (e) {
                        error(e);
                    }
                }, CONF.DRV_MATCH_TIMEOUT));
            }
        } catch (e) {
            error(e);
        }
    });
}

//TODO: Finish Driver Interest
function _is_interested_in(drv: IDriver, dev: IDevice, currentStage, tracker: _tracker, d_assump, d_bus, d_conf, d_ownership, stateChange?) {
    var interested = drv.interest();

    if (interested.otherDriver == false && tracker && tracker.parent) return 0;

    if (interested.all) return 1;

    if (interested.stateChange && stateChange) {
        return 2;
    }

    var cc = currentStage == 0 ? interested.match : interested.change;
    if (!cc) return 0;
    if (!Array.isArray(cc)) cc = [cc];
    for (var tt = 0; tt < cc["length"]; tt++) { //and logic
        var c = cc[tt];
        var result = 0;
        if (c) {
            if (c.otherDriver == false && tracker && tracker.parent) return 0;
            else if (c.all) {
                result = 1;
            }
            else if (c["stateChange"] && stateChange) {
                result = 2;
            }
            else if (c["ownership"] && d_ownership) {
                result = 10;
            }
            else if (c.delta) {
                if (d_conf && c.delta.config && query.first([d_conf], c.delta.config)) {
                    result = 3;
                }
                else if (d_bus && c.delta.bus && query.first([d_bus], c.delta.bus)) {
                    result = 4;
                }
                else if (d_assump
                    && c.delta.assumption
                    && query.first([d_assump], c.delta.assumption)) {
                    result = 5;
                }
            } else if (dev.config && c.config && query.first([dev.config], c.config)) {
                result = 6;
            } else if (dev.bus && c.bus && query.first([dev.bus], c.bus)) {
                result = 7;
            } else if (dev.assumptions
                && c.assumptions
                && !c.assumptions["*"]
                && query.first([dev.assumptions], c.assumptions)) {
                result = 8;
            } else if (dev.assumptions
                && c.assumptions && c.assumptions["*"]) {
                for (var i in dev.assumptions) {
                    if (query.first([dev.assumptions[i]], c.assumptions["*"])) {
                        result = 9;
                        break;
                    }
                }
            }
        }
        if (!result) return 0;
    }
    //match delta first
    //cuz delta costs less
    return 1;
}

export function DeviceChange(dev: IDevice, tracker: _tracker, assump: IDeviceAssumption, busDelta: IBusData, config: KVSet, ownership, stateChange?) {

    if (stateChange) {
        fatal("Device Online --- " + dev.bus.name + " [" + dev.bus.hwaddr + "] ");
    }

    __EMIT("Device.change", dev.id, dev, {
        tracker: tracker,
        assumption: assump,
        bus: busDelta,
        config: config,
        stateChange: stateChange,
        ownership: ownership
    });

    var tracker = tracker ? tracker : <_tracker>{
        depth: 0
    };

    //info("Change_Chain:" + tracker.depth);
    //info(tracker);

    if (CONF.IS_DEBUG && tracker.depth > 0) {
        trace(tracker);
    }

    if (tracker.depth > CONF.MAX_DRIVERCHAIN_DEPTH) {
        warn("Max DriverChain Exceeded (" + tracker.depth + ") ! ROOT_CAUSE:" + tracker.root);
    }


    //trace(Drivers);
    /* UNLEASHHH DA POWER OF..  */
    /* ..cpu  ->  hot from now  */
    for (var driver_id in Drivers) {
        if (driver_id == tracker.parent || !has(Drivers, driver_id) || !Drivers_BusMapping[dev.bus.name] || !Drivers[driver_id].status() ||
            (!Drivers_BusMapping[dev.bus.name] && !Drivers_BusMapping[dev.bus.name][driver_id])) continue;
        //TODO: Add Driver Preference Here!!!! HIGH PRIORITY
        //TODO: Finish Driver-Interest - this is not completed

        //Preference? Sure
        //Almost done.
        _notify_driver(Drivers[driver_id], dev, tracker, assump, busDelta, config, ownership, stateChange);
    }

}

export function DeviceDrop(dev: IDevice, busDelta?) {
    var version = dev.time;
    fatal("Drop - " + dev.bus.name + " [" + dev.bus.hwaddr + "] " + (dev.state ? " UP" : " DOWN"));
    for (var i in dev.assumptions) {
        if (!has(dev.assumptions, i) || !dev.assumptions[i].valid || !Drivers[i] || !Drivers[i].status() || !Drivers_BusMapping[dev.bus.name][i]) {
            continue;
        }
        (function(i) {
            var drv = Drivers[i];
            process.nextTick(() => {
                try {
                    trace("Detach -> " + drv.name());

                    drv.detach(dev, {
                        assumption: undefined,
                        bus: busDelta,
                        config: undefined,
                        ownership: undefined
                    }, <any>once((err, fin_assumption) => {
                        if (!_sanity_check(version, dev, drv, err) || !fin_assumption) return;
                        _update_driver_data(drv, dev, fin_assumption, {
                            depth: 1, root: drv.id()
                        });
                    }));
                } catch (e) {
                    error(e);
                }
            });
        })(i);
    }
}

export function DriverInvoke(driverId, deviceId, actionId, params: KVSet, cb) {
    //TODO: add invoking user info
    // plus:  params['user']
    
    if (!Drivers[driverId]) return cb(new Error("Driver does not exist, or not available"));
    if (!DeviceManager.Devices()[deviceId]) return cb(new Error("Device does not exist"));

    if (!DeviceManager.Devices()[deviceId].state) {
        if(CONF.ALLOW_UNSAFE_DEVICE_INVOKATION){
            error("Device is offline, this might be a dangerous call to remote drivers ! ALLOW_UNSAFE_DEVICE_INVOKATION = true");
        } else {
            return cb(new Error("Target Device does not seem online"));
        }
    }

    if (!DeviceManager.Devices()[deviceId].assumptions[driverId] || 
        !DeviceManager.Devices()[deviceId].assumptions[driverId].valid) return cb(new Error("Driver Assumption is not valid"));

    if (! (DeviceManager.Devices()[deviceId].assumptions[driverId].hasOwnProperty(actionId)
        || DeviceManager.Devices()[deviceId].assumptions[driverId][actionId] === null
        || DeviceManager.Devices()[deviceId].assumptions[driverId][actionId] === undefined
        || DeviceManager.Devices()[deviceId].assumptions[driverId][actionId] === 0
        ))
        return cb(new Error("Driver Assumption does not contain action"));

    console.log("PHASE A PASSED");

    DB.QueryType(2, (err, actions) => {
        if (err) return cb(err);
        else {
            if (!actions.hasOwnProperty(actionId))
                return cb(new Error('Illegal action assumption: ' + actionId));

            //check arguments
            var args = actions[actionId]['arguments'];
            if (args.required && Object.keys(args.required).length > 0) {//required {}
                for (var k in args.required) {
                    if (!params.hasOwnProperty(k)) {
                        if (args.required[k]['default'])
                            params[k] = args.required[k]['default'];
                        else
                            return cb(new Error('Missing argument: ' + k));
                    } else if (args.required[k].datatype && args.required[k].datatype !== typeof params[k]) {
                        return cb(new Error('Illegal argument type: ' + k));
                    }
                }
            }
            if (args.mutex && args.mutex.length > 0) { //mutex []
                for (var i = 0, len = args.mutex.length; i < len; i++) {
                    var exists = [];
                    for (var k in args.mutex[i]) { // {}
                        if (params.hasOwnProperty(k)) {
                            if (args.mutex[k] && args.mutex[k].datatype && args.mutex[k].datatype !== typeof params[k])
                                return cb(new Error('Illegal argument type: ' + k));
                            exists.push(k);
                        }
                    }
                    if (exists.length !== 1)
                        return cb(new Error('Mutex argument expected: 1, but actual: ' + exists.join(',')));
                }
            }
            if (args.optional && args.optional.length > 0) {
                for (var i = 0, len = args.optional.length; i < len; i++) {
                    for (var k in args.optional[i]) { // {}
                        if (params.hasOwnProperty(k)) {
                            if (args.optional[k] && args.optional[k].datatype && args.optional[k].datatype !== typeof params[k])
                                return cb(new Error('Illegal argument type: ' + k));
                        }
                    }
                }
            }

            var dev = DeviceManager.Devices()[deviceId];
            return Drivers[driverId].invoke(dev, actionId, params, cb);
        }
    });
}

// 
// function DriverMatch(actionId, callback) {
//     var drvs = [];
//     var devices = DeviceManager.Devices();
//     for (var d in devices) {
//         if (devices[d].assumptions) {
//             for (var k in Drivers) {
//                 var assump = devices[d].assumptions[Drivers[k].id()];
//                 if (assump && assump.actions && assump.actions.hasOwnProperty(actionId)) {
//                     drvs.push({driverId: k, deviceId: d});
//                 }
//             }
//         }
//     }
//     return callback(undefined, drvs);
// }

export function Initialize(cb) {
    trace("Init..");
    cb();
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.GRAPHD);
    sub.graphd.on('set', (oldValue, newValue) => {
        if (!newValue || !oldValue) {
            return;
        }
        if (oldValue.Status !== "running" && newValue.Status === "running") {
            ForceProbeAll();
        }
    });
    cb();
}

function __driverChangeDevice(inAppDrvId, deviceId, assump: IDeviceAssumption, cb) {
    var appUid = RuntimePool.GetCallingRuntime(this).App.uid;
    var drvId = "App_" + appUid + ":" + inAppDrvId;
    var driver = Drivers[drvId];
    var device = DeviceManager.Get(deviceId);
    if (driver && device) {
        DriverActiveUpdate(driver, device, assump);
    }
    cb();
}


export function GetDriverDesc(driver: IDriver) {
    var drv = {
        name: driver.name(),
        status: driver.status(),
        interest: driver.interest(),
        bus: driver.bus(),
        id: driver.id(),
        type: driver["Runtime"] ? "App" : "System"
    };
    if (driver["Runtime"]) {
        drv["app"] = RuntimePool.GetSnapshot(driver["Runtime"])
    }
    return drv;
}

function GetDriverDescription(ids, cb) {
    //Forms description for driver
    if (!ids) return cb(new Error('DriverId is missing'));
    if (!Array.isArray(ids)) {
        ids = [ids];
    }
    var result = {};
    for (var i = 0; i < ids.length; i++) {
        var cur = ids[i];
        result[cur] = undefined;
        var drv = Drivers[cur];
        if (drv) {
            result[cur] = GetDriverDesc(drv);
        }
    }
    return cb(undefined, result);
}


__API(__driverChangeDevice, 'Device.Change', [Permission.Driver]);
__API(DriverInvoke, 'Driver.Invoke', [Permission.Driver]);
// __API(DriverMatch, 'Driver.Match', [Permission.Driver]);
__API(GetDriverDescription, 'Driver.GetDescription');


__EVENT("Device.change", [Permission.DeviceAccess]);
__EVENT("Driver.down", [Permission.Driver]);
__EVENT("Driver.up", [Permission.Driver]); //not used
__EVENT("Driver.reload", [Permission.Driver]);