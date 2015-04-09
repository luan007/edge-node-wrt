var Node = require("Node");
var Core = require("Core");
var Drivers = {};
var Drivers_BusMapping = {};
var InterestCache = {};
exports.Events = new Node.events.EventEmitter();
var query = require("underscore-query")(_);
var pursuit = require("pursuit");
function InvalidateDrvInterest(drvId) {
    delete InterestCache[drvId];
}
exports.InvalidateDrvInterest = InvalidateDrvInterest;
function LoadDriver(drv, cb) {
    if (drv) {
        var reload = false;
        if (!has(Drivers, drv.id())) {
            info("Loading Driver " + drv.name().bold + " to BUS(es) " + ('' + JSON.stringify(drv.bus())).bold);
        }
        else {
            reload = true;
            info("Reloading Driver " + drv.name().bold + " to BUS(es) " + ('' + JSON.stringify(drv.bus())).bold);
        }
        drv.load(function (err) {
            var drvId = drv.id();
            var buses = drv.bus();
            Drivers[drvId] = drv;
            for (var i = 0; i < buses.length; i++) {
                var busName = buses[i];
                if (has(Drivers_BusMapping[busName], drvId)) {
                    Drivers_BusMapping[busName][drvId] = undefined;
                }
            }
            for (var i = 0; i < buses.length; i++) {
                if (!Drivers_BusMapping[buses[i]])
                    Drivers_BusMapping[buses[i]] = {};
                Drivers_BusMapping[buses[i]][drvId] = drv;
            }
            info("UP - " + drv.name().bold);
            if (reload) {
                __EMIT("Driver.reload", drv.id());
            }
            else {
                __EMIT("Driver.up", drv.id());
            }
            var devs = Core.Device.DeviceManager.Devices();
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
exports.LoadDriver = LoadDriver;
function _sanity_check(ver, dev, drv, err) {
    if (err === void 0) { err = false; }
    return drv.status() && dev.time.getTime() - ver == 0 && !err;
}
function _update_driver_data(drv, dev, assump, tracker) {
    if (!drv || !drv.status() || !dev || !Drivers[drv.id()])
        return;
    var real = {};
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
    real.driverId = drv.id();
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
        real.actions = real.actions ? real.actions : {};
        real.classes = real.classes ? real.classes : {};
        real.aux = real.aux ? real.aux : undefined;
        real.valid = real.valid ? real.valid : false;
        real.attributes = real.attributes ? real.attributes : {};
        delta = real;
    }
    if (Object.keys(delta).length == 0) {
        return;
    }
    fatal(delta);
    exports.Events.emit("change", dev, drv, delta);
    var ntracker = {
        depth: tracker.depth + 1,
        parent: real.driverId,
        root: tracker.root
    };
    process.nextTick(function () {
        DeviceChange(dev, ntracker, delta, undefined, undefined, undefined);
    });
}
function DriverActiveUpdate(drv, dev, assump) {
    _update_driver_data(drv, dev, assump, {
        depth: 1,
        root: drv.id()
    });
}
exports.DriverActiveUpdate = DriverActiveUpdate;
function _notify_driver(driver, dev, tracker, delta, deltaBus, deltaConf, deltaOwn, stateChange) {
    process.nextTick(function () {
        var drvId = driver.id();
        var version = dev.time.getTime();
        var myAssump = dev.assumptions[drvId];
        if (!_sanity_check(version, dev, driver))
            return;
        try {
            if (myAssump && myAssump.valid && _is_interested_in(driver, dev, 1, tracker, delta, deltaBus, deltaConf, deltaOwn, stateChange)) {
                trace("Change -> " + driver.name());
                driver.change(dev, {
                    assumption: delta,
                    bus: deltaBus,
                    config: deltaConf,
                    ownership: deltaOwn
                }, once(function (err, assump) {
                    if (!assump || !_sanity_check(version, dev, driver, err))
                        return;
                    _update_driver_data(driver, dev, assump, tracker);
                }));
            }
            else if (!(myAssump && myAssump.valid) && _is_interested_in(driver, dev, 0, tracker, delta, deltaBus, deltaConf, deltaOwn, stateChange)) {
                trace("Match -> " + driver.name());
                driver.match(dev, {
                    assumption: delta,
                    bus: deltaBus,
                    config: deltaConf,
                    ownership: deltaOwn
                }, must(function (err, data) {
                    if (!data || !_sanity_check(version, dev, driver, err))
                        return;
                    try {
                        trace("Attach -> " + driver.name());
                        driver.attach(dev, {
                            assumption: delta,
                            bus: deltaBus,
                            config: deltaConf,
                            ownership: deltaOwn
                        }, data, once(function (err, assump) {
                            if (!assump || !_sanity_check(version, dev, driver, err))
                                return;
                            _update_driver_data(driver, dev, assump, tracker);
                        }));
                    }
                    catch (e) {
                        error(e);
                    }
                }, CONF.DRV_MATCH_TIMEOUT));
            }
        }
        catch (e) {
            error(e);
        }
    });
}
function _is_interested_in(drv, dev, currentStage, tracker, d_assump, d_bus, d_conf, d_ownership, stateChange) {
    var interested = drv.interest();
    if (interested.otherDriver == false && tracker && tracker.parent)
        return 0;
    if (interested.all)
        return 1;
    if (interested.stateChange && stateChange) {
        return 2;
    }
    var cc = currentStage == 0 ? interested.match : interested.change;
    if (!cc)
        return 0;
    if (!Array.isArray(cc))
        cc = [cc];
    var matched = 0;
    for (var tt = 0; tt < cc["length"]; tt++) {
        var c = cc[tt];
        var result = 0;
        if (c) {
            if (c.otherDriver == false && tracker && tracker.parent)
                return 0;
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
                else if (d_assump && c.delta.assumption && query.first([d_assump], c.delta.assumption)) {
                    result = 5;
                }
            }
            else if (dev.config && c.config && query.first([dev.config], c.config)) {
                result = 6;
            }
            else if (dev.bus && c.bus && query.first([dev.bus], c.bus)) {
                result = 7;
            }
            else if (dev.assumptions && c.assumptions && !c.assumptions["*"] && query.first([dev.assumptions], c.assumptions)) {
                result = 8;
            }
            else if (dev.assumptions && c.assumptions && c.assumptions["*"]) {
                for (var i in dev.assumptions) {
                    if (query.first([dev.assumptions[i]], c.assumptions["*"])) {
                        result = 9;
                        break;
                    }
                }
            }
        }
        if (!result)
            return 0;
    }
    return 1;
}
function DeviceChange(dev, tracker, assump, busDelta, config, ownership, stateChange) {
    if (stateChange) {
        trace("Device Online - " + dev.bus.name + " [" + dev.bus.hwaddr + "] ");
    }
    __EMIT("Device.change", dev.id, dev, {
        tracker: tracker,
        assumption: assump,
        bus: busDelta,
        config: config,
        stateChange: stateChange,
        ownership: ownership
    });
    var tracker = tracker ? tracker : {
        depth: 0
    };
    if (CONF.IS_DEBUG && tracker.depth > 0) {
        trace(tracker);
    }
    if (tracker.depth > CONF.MAX_DRIVERCHAIN_DEPTH) {
        warn("Max DriverChain Exceeded (" + tracker.depth + ") ! ROOT_CAUSE:" + tracker.root);
    }
    for (var driver_id in Drivers) {
        if (driver_id == tracker.parent || !has(Drivers, driver_id) || !Drivers_BusMapping[dev.bus.name] || !Drivers[driver_id].status() || !Drivers_BusMapping[dev.bus.name][driver_id])
            continue;
        _notify_driver(Drivers[driver_id], dev, tracker, assump, busDelta, config, ownership, stateChange);
    }
}
exports.DeviceChange = DeviceChange;
function DeviceDrop(dev, busDelta) {
    var version = dev.time;
    fatal("Drop - " + dev.bus.name + " [" + dev.bus.hwaddr + "] " + (dev.state ? " UP" : " DOWN"));
    for (var i in dev.assumptions) {
        fatal(i);
        if (!has(dev.assumptions, i) || !dev.assumptions[i].valid || !Drivers[i] || !Drivers[i].status() || !Drivers_BusMapping[dev.bus.name][i]) {
            continue;
        }
        (function (i) {
            var drv = Drivers[i];
            process.nextTick(function () {
                try {
                    trace("Detach -> " + drv.name());
                    drv.detach(dev, {
                        assumption: undefined,
                        bus: busDelta,
                        config: undefined,
                        ownership: undefined
                    }, once(function (err, fin_assumption) {
                        if (!_sanity_check(version, dev, drv, err) || !fin_assumption || _.isEqual(prevAssump, fin_assumption))
                            return;
                        fin_assumption.driverId = drv.id();
                        var prevAssump = dev.assumptions[i];
                        dev.assumptions[fin_assumption.driverId] = fin_assumption;
                        exports.Events.emit("change", dev, drv);
                    }));
                }
                catch (e) {
                    error(e);
                }
            });
        })(i);
    }
}
exports.DeviceDrop = DeviceDrop;
function DriverInvoke(drv, dev, actionId, params, cb) {
    drv.invoke(dev, actionId, params, cb);
}
exports.DriverInvoke = DriverInvoke;
function Initialize(callback) {
    trace("Init..");
    async.series([
        LoadDriver.bind(null, (require("./Driver/TestDriver")).Instance),
        LoadDriver.bind(null, (require("./Driver/OUI")).Instance),
        LoadDriver.bind(null, (require("./Driver/NameService")).Instance)
    ], callback);
}
exports.Initialize = Initialize;
__EVENT("Device.change", [4 /* DeviceAccess */]);
__EVENT("Driver.down", [14 /* Driver */]);
__EVENT("Driver.up", [14 /* Driver */]);
__EVENT("Driver.reload", [14 /* Driver */]);
