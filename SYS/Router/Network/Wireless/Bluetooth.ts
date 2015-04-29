import bluez = require('../../../Common/Native/bluez');
import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import Status = require('../../../Common/Stat/Status');

export var BluezInstance = new bluez.Bluez();

export function Initialize(cb) {
    configBluez.Initialize(cb);
}

class Configuration extends Config {

    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);

        this.Initialize(()=>{});
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
        var _default = this.Get();
        this.Reload(_default, cb);
    };

}
var defaultConfig = {
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
export var configBluez = new Configuration(SECTION.BLUETOOTH, defaultConfig);

__API(withCb(configBluez.Get), "Network.Bluetooth.Config.Get", [Permission.Network, Permission.Configuration]);
