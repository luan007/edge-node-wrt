var UAParser = require('ua-parser-js');
var parser = new UAParser.UAParser();

class P0FService implements IInAppDriver {

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        //console.log("------------\n P0f match Called", dev.bus.data);
        var matched = (dev.bus.data.P0F && Object.keys(dev.bus.data.P0F).length > 0) ? {} : undefined;
        cb(undefined, matched);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        console.log("P0f ATTACH Called");
        cb(undefined, {valid: true});
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        var useragent = parser.setUA(dev.bus.data.P0F.ua).getResult();
        console.log("P0f CHANGE Called");
        cb(undefined, {
            actions: {},
            classes: {},
            aux: {
                UserAgent: useragent
            },
            attributes: {
                Assumption: dev.bus.data.P0F.assumption
            },
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