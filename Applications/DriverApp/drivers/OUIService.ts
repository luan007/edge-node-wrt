import OUI = require('../OUI/OUI');

class OUI_Identifier implements IInAppDriver {

    __find = (dev, cb) => {
        //var t1 = new Date().getTime();
        var _oui_Str = (dev.bus.hwaddr + "").substr(0, 8);
        OUI.OUI_Find(_oui_Str, (err, result) => {
            //var t2 = new Date().getTime();
            //return console.log('OUI total consumed seconds:', (t2 - t1)/1000);
            if (!result) {
                console.log("OUI Not Found " + _oui_Str);
                return cb();
            }
            cb(undefined, {
                actions: {},
                attributes: {
                    vendor: result
                },
                classes: {},
                aux: {},
                valid: true
            });
        });
    }


    match = (dev:IDevice, delta, cb:Callback) => {
        var matched = dev.bus.hwaddr.length > 8 ? {} : undefined;
        cb(undefined, matched);
    };

    attach = (dev:IDevice, delta, matchResult:any, cb:PCallback<IDeviceAssumption>) => {
        console.log("OUI ATTACH Called");
        this.__find(dev, cb);
    };

    change = (dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) => {
        cb(undefined, undefined);
    };

    detach = (dev:IDevice, delta, cb:PCallback<IDeviceAssumption>) => {
        cb(undefined, {valid: true});
    };

    load = (cb:Callback) => {
        return cb(undefined, true);
    };

    unload = (cb:Callback) => {
        return cb(undefined, true);
    };

    invoke = (dev, actionId, params, cb) => {
        return cb(undefined, true);
    };

}

export var Instance = new OUI_Identifier();
