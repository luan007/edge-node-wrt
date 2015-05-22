/*TODO: This is so broken, total destruction IS needed*/
import DeviceManager = require('./DeviceManager');
import events = require('events');

var Drivers: IDic<IDriver> = {};
var Drivers_BusMapping: IDic<IDic<IDriver>> = {};
var InterestCache = {};

export var Events = new events.EventEmitter();

var query = require("underscore-query")(_);
var pursuit = require("pursuit"); //TODO: Investigate Underscore_Query's performance

export function InvalidateDrvInterest(drvId) {
    //TODO: swap to pursuit if you want..
    delete InterestCache[drvId];
}

export function LoadDriver(drv: IDriver, cb) {
    if (drv /* && !has(Drivers, drv.id())*/) {
        var reload = false;
        if (!has(Drivers, drv.id())) {
            info("Loading Driver " + drv.name().bold + " to BUS(es) " + (''+JSON.stringify(drv.bus())).bold);
        } else {
            reload = true;
            info("Reloading Driver " + drv.name().bold + " to BUS(es) " + (''+JSON.stringify(drv.bus())).bold);
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
            //Don't care..
            info("UP - " + drv.name().bold);
            if (reload) {
                __EMIT("Driver.reload", drv.id());
            } else {
                __EMIT("Driver.up", drv.id());
            }
            var devs = DeviceManager.Devices();
            for (var q in devs) {
                _notify_driver(drv, devs[q], {
                    depth: 1,
                    root: drv.id(),
                    parent: undefined
                }, undefined, undefined, undefined, undefined);
            }
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

function _update_driver_data(drv: IDriver, dev: IDevice, assump: IDeviceAssumption, tracker: _tracker) {
    if (!drv || !drv.status() || !dev || !Drivers[drv.id()]) return;
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
                if (_.isArray(assump.classes)) {
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
    //warn("has change!");
    //dev.assumptions[assump.driverId] = assump;
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
        return; //skipped
    }
    fatal(delta);

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

export function DriverActiveUpdate(drv: IDriver, dev: IDevice, assump: IDeviceAssumption) {
    _update_driver_data(drv, dev, assump, {
        depth: 1, root: drv.id()
    });
}

function _notify_driver(driver: IDriver, dev: IDevice, tracker: _tracker, delta: IDeviceAssumption, deltaBus: IBusData, deltaConf: KVSet, deltaOwn, stateChange?) {
    process.nextTick(() => {
        var drvId = driver.id();
        var version = dev.time.getTime();
        var myAssump = dev.assumptions[drvId];
        if (!_sanity_check(version, dev, driver)) return; //WTF??
        //console.log(JSON.stringify(dev));
        try {
            if (myAssump && myAssump.valid && _is_interested_in(driver, dev, 1, tracker, delta, deltaBus, deltaConf, deltaOwn, stateChange)) {
                trace("Change -> " + driver.name());
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
                trace("Match -> " + driver.name());
                //need match/attach
                //TODO: Verify EmitterizeCB's impact/influence on GC, to see if it solves the 'ghost CB' prob
                driver.match(dev, {
                    assumption: delta,
                    bus: deltaBus,
                    config: deltaConf,
                    ownership: deltaOwn
                }, <any>must((err, data) => {
                    if (!data || !_sanity_check(version, dev, driver, err)) return;
                    try {
                        trace("Attach -> " + driver.name());
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
    var matched = 0;
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
                        result = 9; break;
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
        fatal("Device Online - " + dev.bus.name + " [" + dev.bus.hwaddr + "] ");
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

    //fatal("Device Change");
    //fatal("Id");
    //trace(dev.id);
    //fatal("Bus");
    //trace(dev.bus);
    //fatal("Assumptions");
    //for (var i in dev.assumptions) {
    //    trace(i);
    //    trace(dev.assumptions[i]);
    //}
    
    //trace(Drivers);
    /* UNLEASHHH DA POWER OF..  */
    /* ..cpu  ->  hot from now  */
    for (var driver_id in Drivers) {
        if (driver_id == tracker.parent ||
            !has(Drivers, driver_id) ||
            !Drivers_BusMapping[dev.bus.name] || 
            !Drivers[driver_id].status() ||
            !Drivers_BusMapping[dev.bus.name][driver_id]) continue;
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
        fatal(i);
        if (!has(dev.assumptions, i) ||
            !dev.assumptions[i].valid ||
            !Drivers[i] || !Drivers[i].status() ||
            !Drivers_BusMapping[dev.bus.name][i]) {
            continue;
        }
        (function (i) {
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
                        if (!_sanity_check(version, dev, drv, err) ||
                            !fin_assumption ||
                            _.isEqual(prevAssump, fin_assumption)) return;
                        fin_assumption.driverId = drv.id();
                        var prevAssump = dev.assumptions[i];
                        dev.assumptions[fin_assumption.driverId] = fin_assumption;
                        Events.emit("change", dev, drv);
                    }));
                } catch (e) {
                    error(e);
                }
            });
        })(i);
    }
}

export function DriverInvoke(drv: IDriver, dev: IDevice, actionId, params, cb) {
    drv.invoke(dev, actionId, params, cb); //TODO: not finished
}

export function Initialize(cb) {
    trace("Init..");
    cb();
    //async.series([
        //LoadDriver.bind(null,(require("./Driver/TestDriver")).Instance),
        //LoadDriver.bind(null,(require("./Driver/OUI")).Instance),
        //LoadDriver.bind(null,(require("./Driver/NameService")).Instance)
    //], callback);
}




__EVENT("Device.change", [Permission.DeviceAccess]);
__EVENT("Driver.down", [Permission.Driver]);
__EVENT("Driver.up", [Permission.Driver]); //not used
__EVENT("Driver.reload", [Permission.Driver]);