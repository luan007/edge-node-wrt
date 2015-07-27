/// <reference path="../global.d.ts" />
var events = require("events");
var child_process = require("child_process");

class YeelightService implements IInAppDriver {

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        return dev.bus.data.name && dev.bus.data.name.indexOf("Yeelight ") > -1;
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
    }

    detach(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
    }

    load(cb:Callback) {
    }

    unload(cb:Callback) {
    }

    invoke(dev:IDevice, actionId, params, cb) {
    }

}

export var Instance = new YeelightService();