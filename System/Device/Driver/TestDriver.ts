import Node = require("Node");
import Core = require("Core");

class TestDriver implements IDriver {

    id() {
        return "_TEST_DRV_";
    }

    interest() {
        return {
            all: true
        };
    }

    name() {
        return "TestDriver";
    }

    status() {
        return 1; //always on..
    }

    bus(): string[]{
        return [ "WLAN" ];
    }

    match(dev: IDevice, delta, cb: Callback) {
        trace("MATCH Called");
        //cb(undefined, { foo:"bar" });
    }

    attach(dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) {
        info("ATTACH Called");
        cb(undefined, {
            actions: {},
            attributes: {},
            classes: {},
            valid: true
        });
    }

    change(dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) {
        fatal("CHANGE Called");
        cb(undefined, {
            actions: {},
            attributes: {},
            classes: {},
            valid: true
        });
    }

    detach(dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) {

    }

    load(cb: Callback) {
        cb();
    }

    unload(cb: Callback) {

    }

    invoke(dev, actionId, params, cb) {

    }

}

export var Instance = new TestDriver();