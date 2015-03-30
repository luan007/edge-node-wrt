import Node = require("Node");
import Core = require("Core");
import Abstract = Core.Lib.Abstract;
import Native = Core.SubSys.Native;

export var BluezInstance = new Native.bluez.Bluez();

export function Initialize(cb) {
    Config.Initialize(cb);
}

class Configuration extends Abstract.Configurable {

    Default = {
        HCI: {
            Power: true,
            Name: "Edge-Router",
            Hidden: false
        },
        Audio: {
            Power: true,
            Name: "Edge-Router-Audio",
            Hidden: false
        }
    };

    constructor() {
        super();
    }

    private _applyHCI = (mod, cb) => {
        if (!mod || Object.keys(mod).length == 0) return cb();
        if (!has(mod, "HCI")) {
            return cb();
        }
        mod = mod.HCI;
        var change = false;
        if (has(mod, "Power")) {
            BluezInstance.GenericPower = mod.Power;
            change = true;
        }
        if (has(mod, "Name")) {
            BluezInstance.GenericName = mod.Name;
            change = true;
        }
        if (has(mod, "Hidden")) {
            BluezInstance.GenericScan = !mod.Hidden ? "piscan" : "noscan";
            change = true;
        }
        return cb(undefined, change);
    };

    private _applyAUD = (mod, cb) => {
        if (!mod || Object.keys(mod).length == 0) return cb();
        if (!has(mod, "Audio")) {
            return cb();
        }
        mod = mod.Audio;
        var change = false;
        if (has(mod, "Power")) {
            BluezInstance.AudioPower = mod.Power;
            change = true;
        }
        if (has(mod, "Name")) {
            BluezInstance.AudioName = mod.Name;
            change = true;
        }
        if (has(mod, "Hidden")) {
            BluezInstance.AudioScan = !mod.Hidden ? "piscan" : "noscan";
            change = true;
        }
        return cb(undefined, change);
    };

    protected _apply = (mod, raw, cb: Callback) => {
        async.series([
            this._applyHCI.bind(this, mod),
            this._applyAUD.bind(this, mod)
        ],(err, result) => {
                var change = false;
                for (var i = 0; i < result.length; i++) {
                    if (result) {
                        change = true;
                        break;
                    }
                }
                if (change || !BluezInstance.Process) {
                    BluezInstance.Start(true);
                }
                cb();
        });
    };

    public Initialize = (cb) => {
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "BLUETOOTH");
        this.Reload(this.Default, cb);
    };

}

export var Config = new Configuration();

__API(withCb(Config.Get), "Network.Bluetooth.Config.Get", [Permission.Network, Permission.Configuration]);
__API(Config.Apply, "Network.Bluetooth.Config.Apply", [Permission.Network, Permission.Configuration]);