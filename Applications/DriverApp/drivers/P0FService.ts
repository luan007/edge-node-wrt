//Resolve Device Name into DNS domains
//Also generates generic "name" if there's nothing set
//
class P0FService implements IInAppDriver {

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        //console.log("------------\n P0f match Called", dev.bus.data);
        var matched = (dev.bus.data.P0F && Object.keys(dev.bus.data.P0F).length > 0) ? {} : undefined;
        cb(undefined, matched);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        console.log("P0f ATTACH Called", dev.bus);
        cb(undefined, {
            actions: {},
            classes: {},
            aux: {},
            attributes: { P0F: dev.bus.data.P0F } ,
            valid: true
        });
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        console.log("P0f CHANGE Called", dev.bus);
        cb(undefined, {
            actions: {},
            classes: {},
            aux: {},
            attributes: { P0F: dev.bus.data.P0F } ,
            valid: true
        });
    }

    detach(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        cb(undefined, {valid: true});
    }

    load(cb:Callback) {
        return cb(undefined, true);
    }

    unload(cb:Callback) {
        return cb(undefined, true);
    }

    invoke(dev:IDevice, actionId, params, cb) {
        return cb(undefined, true);
    }

}

export var Instance = new P0FService();