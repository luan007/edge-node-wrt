import OUI = require('../OUI/OUI');

class OUI_Identifier implements IDriver {

    id = () => {
        return "_OUI_";
    };

    interest = (): IDriverInterest => {
        return {
            stateChange: true
        };
    };

    name = () => {
        return "OUI Identifier";
    };

    status = () => {
        return 1; //always on..
    };

    bus = (): string[]=> {
        return ["WLAN"];
    };

    match = (dev: IDevice, delta, cb: Callback) => {
        var matched = dev.bus.hwaddr.length > 8 ? {} : undefined;
        cb(undefined, matched);
    };

    attach = (dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) => {
        console.log("OUI ATTACH Called");
        var _oui_Str = (dev.bus.hwaddr + "").substr(0, 8);
        OUI.OUI_Find(_oui_Str,(err, result) => {
            if (!result) {
                console.log("OUI Not Found " + _oui_Str);
                return cb(undefined, undefined);
            }
            cb(undefined, {
                actions: {},
                attributes: {
                    vendor: {
                        name: result,
                        icon: ""
                    }
                },
                classes: {},
                valid: true
            });
        });
    };

    change = (dev: IDevice, delta: IDriverDetla, cb: PCallback<IDeviceAssumption>) => {
        cb(undefined, undefined);
    };

    detach = (dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) => {
        cb(undefined, undefined);
    };

    load = (cb: Callback) => {
        return cb(undefined, true);
    };

    unload = (cb: Callback) => {
        return cb(undefined, true);
    };

    invoke = (dev, actionId, params, cb) => {
        return cb(undefined, true);
    };

}

export var Instance = new OUI_Identifier();
