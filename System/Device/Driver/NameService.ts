﻿import Node = require("Node");
import Core = require("Core");


//Resolve Device Name into DNS domains
//Also generates generic "name" if there's nothing set
//
class NameService implements IDriver {

    id() {
        return "NameService";
    }

    interest() {
        return {
            all: true
        };
    }

    name() {
        return "NameService";
    }

    status() {
        return 1; //always on..
    }

    bus(): string[] {
        return ["WLAN"];
    }

    match(dev: IDevice, delta, cb: Callback) {
        //should fetch name? or not :(
        return cb(undefined, !!dev.bus.data.Lease);
    }

    attach(dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) {
        if (!dev.bus.data.Lease) {
            //return cb(new Error("Lease is missing")), undefined);
        } else {
            //Let's check the lease..

        }
    }

    change(dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) {
        return cb(undefined, undefined);
    }

    detach(dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) {
        return cb(undefined, undefined);
    }

    load(cb: Callback) {
        return cb();
    }

    unload(cb: Callback) {
        return cb();
    }

    invoke(dev, actionId, params, cb) {

    }

}

export = NameService;