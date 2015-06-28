var ipp = require('ipp');

class IPPService implements IInAppDriver {

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        console.log("--------------- IPP match Called");
        cb(undefined, true);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- IPP attach Called");
        cb(undefined, true);
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

export var Instance = new IPPService();