/*TODO: This is so broken, total destruction IS needed*/

import Node = require("Node");
import Core = require("Core");

var Drivers: IDic<IDriver> = {};
var Drivers_BusMapping: IDic<IDic<IDriver>> = {};
export var Events = new Node.events.EventEmitter();

export function LoadDriver(drv: IDriver, cb) {
    if (drv /* && !has(Drivers, drv.id())*/ ) {
        if (!has(Drivers, drv.id())) {
            info("Loading Driver " + drv.name().bold + " to BUS(es) " + (''+JSON.stringify(drv.bus())).bold);
        } else {
            info("Reloading Driver " + drv.name().bold + " to BUS(es) " + (''+JSON.stringify(drv.bus())).bold);
        }
        drv.load((err) => {
            var drvId = drv.id();
            var buses = drv.bus();
            Drivers[drvId] = drv;
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

            var devs = Core.Device.DeviceManager.Devices();
            for (var q in devs) {
                _notify_driver(drv, devs[q], {
                    depth: 1,
                    root: drv.id(),
                    parent: undefined
                }, undefined);
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
        real.classes = real.classes ? real.classes : [];
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
        DeviceChange(dev, ntracker, delta);
    });
}

export function DriverActiveUpdate(drv: IDriver, dev: IDevice, assump: IDeviceAssumption) {
    _update_driver_data(drv, dev, assump, {
        depth: 1, root: drv.id()
    });
}

function _notify_driver(driver: IDriver, dev: IDevice, tracker: _tracker, delta?: IDeviceAssumption) {
    process.nextTick(() => {
        if (_sanity_check(version, dev, driver)) return;
        var drvId = driver.id();
        var version = dev.time.getTime();
        var myAssump = dev.assumptions[drvId];
        //console.log(JSON.stringify(dev));
        try {
            if (myAssump && myAssump.valid) {
                //need change
                driver.change(dev, delta, <any>once((err, assump) => {
                    if (!assump || !_sanity_check(version, dev, driver, err)) return;
                    _update_driver_data(driver, dev, assump, tracker);
                }));
            } else {
                //need match/attach
                //TODO: Verify EmitterizeCB's impact/influence on GC, to see if it solves the 'ghost CB' prob
                driver.match(dev, <any>must((err, data) => {
                    if (!data || !_sanity_check(version, dev, driver, err)) return;
                    try {
                        driver.attach(dev, data, <any>once((err, assump) => {
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

export function DeviceChange(dev: IDevice, tracker: _tracker, delta?: IDeviceAssumption) {

    var tracker = tracker ? tracker : <_tracker>{
        depth: 0
    };

    //info("Change_Chain:" + tracker.depth);
    //info(tracker);

    if (CONF.IS_DEBUG && tracker.depth > 0) {
        console.log(tracker);
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
            !Drivers[driver_id].status() ||
            !Drivers_BusMapping[dev.bus.name][driver_id]) continue;
        //TODO: Add Driver Preference Here!!!! HIGH PRIORITY
        _notify_driver(Drivers[driver_id], dev, tracker, delta);
    }

}

export function DeviceDrop(dev: IDevice) {
    var version = dev.time;
    for (var i in dev.assumptions) {
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
                    drv.detach(dev, <any>once((err, fin_assumption) => {
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

export function Initialize(callback: Callback) {
    trace("Init..");
    async.series([
        LoadDriver.bind(null, new (require("./Driver/OUI"))())
    ], callback);
}