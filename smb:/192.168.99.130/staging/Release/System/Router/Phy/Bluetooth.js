var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Core = require("Core");
var Abstract = Core.Lib.Abstract;
var Native = Core.SubSys.Native;
exports.BluezInstance = new Native.bluez.Bluez();
function Initialize(cb) {
    exports.Config.Initialize(cb);
}
exports.Initialize = Initialize;
var Configuration = (function (_super) {
    __extends(Configuration, _super);
    function Configuration() {
        var _this = this;
        _super.call(this);
        this.Default = {
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
        this._applyHCI = function (mod, cb) {
            if (!mod || Object.keys(mod).length == 0)
                return cb();
            if (!has(mod, "HCI")) {
                return cb();
            }
            mod = mod.HCI;
            var change = false;
            if (has(mod, "Power")) {
                exports.BluezInstance.GenericPower = mod.Power;
                change = true;
            }
            if (has(mod, "Name")) {
                exports.BluezInstance.GenericName = mod.Name;
                change = true;
            }
            if (has(mod, "Hidden")) {
                exports.BluezInstance.GenericScan = !mod.Hidden ? "piscan" : "noscan";
                change = true;
            }
            return cb(undefined, change);
        };
        this._applyAUD = function (mod, cb) {
            if (!mod || Object.keys(mod).length == 0)
                return cb();
            if (!has(mod, "Audio")) {
                return cb();
            }
            mod = mod.Audio;
            var change = false;
            if (has(mod, "Power")) {
                exports.BluezInstance.AudioPower = mod.Power;
                change = true;
            }
            if (has(mod, "Name")) {
                exports.BluezInstance.AudioName = mod.Name;
                change = true;
            }
            if (has(mod, "Hidden")) {
                exports.BluezInstance.AudioScan = !mod.Hidden ? "piscan" : "noscan";
                change = true;
            }
            return cb(undefined, change);
        };
        this._apply = function (mod, raw, cb) {
            async.series([
                _this._applyHCI.bind(_this, mod),
                _this._applyAUD.bind(_this, mod)
            ], function (err, result) {
                var change = false;
                for (var i = 0; i < result.length; i++) {
                    if (result) {
                        change = true;
                        break;
                    }
                }
                if (change || !exports.BluezInstance.Process) {
                    exports.BluezInstance.Start(true);
                }
                cb();
            });
        };
        this.Initialize = function (cb) {
            _this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "BLUETOOTH");
            _this.Reload(_this.Default, cb);
        };
    }
    return Configuration;
})(Abstract.Configurable);
exports.Config = new Configuration();
__API(withCb(exports.Config.Get), "Network.Bluetooth.Config.Get", [11 /* Network */, 12 /* Configuration */]);
__API(exports.Config.Apply, "Network.Bluetooth.Config.Apply", [11 /* Network */, 12 /* Configuration */]);
