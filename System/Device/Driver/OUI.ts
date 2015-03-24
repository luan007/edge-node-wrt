import Node = require("Node");
import Core = require("Core");

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
        cb(undefined, dev.bus.hwaddr.length > 8 ? {} : undefined);
    };

    attach = (dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) => {
        //info("OUI ATTACH Called");
        var _oui_Str = (dev.bus.hwaddr + "").substr(0, 8);
        OUI_Find(_oui_Str,(err, result) => {
            if (!result) {
                fatal("OUI Not Found " + _oui_Str);
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
        cb();
    };

    unload = (cb: Callback) => {
        cb();
    };

    invoke = (dev, actionId, params, cb) => {

    };

}

export var Instance = new OUI_Identifier();