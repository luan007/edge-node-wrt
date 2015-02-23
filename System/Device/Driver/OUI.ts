import Node = require("Node");
import Core = require("Core");

class OUI_Identifier implements IDriver {

    id() {
        return "_OUI_";
    }

    name() {
        return "OUI Identifier";
    }

    status() {
        return 1; //always on..
    }

    bus(): string[] {
        return [ "WLAN" ];
    }

    match(dev: IDevice, cb: Callback) {
        cb(undefined, dev.bus.hwaddr.length > 8 ? {} : undefined);
    }

    attach(dev: IDevice, matchResult: any, cb: PCallback<IDeviceAssumption>) {
        //info("OUI ATTACH Called");
        var _oui_Str = (dev.bus.hwaddr + "").substr(0, 8);
        OUI_Find(_oui_Str,(err, result) => {
            if (!result) {
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
    }

    change(dev: IDevice, delta_from_other_driver: IDeviceAssumption, cb: PCallback<IDeviceAssumption>) {
        cb(undefined, undefined);
    }

    detach(dev: IDevice, cb: PCallback<IDeviceAssumption>) {
        cb(undefined, undefined);
    }

    load(cb: Callback) {
        cb();
    }

    unload(cb: Callback) {
        cb();
    }

    invoke(dev, actionId, params, cb) {

    }

}

export = OUI_Identifier;