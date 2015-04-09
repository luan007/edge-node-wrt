var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Core = require("Core");
var Native = Core.SubSys.Native;
var Iptables = Native.iptables;
var Abstract = Core.Lib.Abstract;
var Network = require("../Network");
exports.WLAN_2G4 = new Native.hostapd.hostapd(CONF.DEV.WLAN.DEV_2G);
exports.WLAN_5G7 = new Native.hostapd.hostapd(CONF.DEV.WLAN.DEV_5G);
exports.Rules = {
    NAT_2G4: new Iptables.Rule(),
    NAT_5G7: new Iptables.Rule()
};
function Initialize(cb) {
    exports.Rules.NAT_2G4.Target = exports.Rules.NAT_5G7.Target = 0 /* ACCEPT */;
    exports.Rules.NAT_2G4.Iface_In = {
        Prefix: CONF.DEV.WLAN.DEV_2G,
        Id: ""
    };
    exports.Rules.NAT_5G7.Iface_In = {
        Prefix: CONF.DEV.WLAN.DEV_5G,
        Id: ""
    };
    async.series([
        Native.iptables.Iptables.NAT.PREROUTING.Add.bind(null, exports.Rules.NAT_2G4),
        Native.iptables.Iptables.NAT.PREROUTING.Add.bind(null, exports.Rules.NAT_5G7),
        exports.Config.Initialize
    ], cb);
}
exports.Initialize = Initialize;
var Configuration = (function (_super) {
    __extends(Configuration, _super);
    function Configuration() {
        var _this = this;
        _super.call(this);
        this.Default = {
            _2G4: {
                Power: true,
                SSID: "EdgeRouter",
                AutoSSID: false,
                Visible: true,
                Channel: 2,
                Password: "testtest",
                NAT: 1,
                Isolation: 0,
                Aux: {
                    "0": {
                        Power: false,
                        SSID: undefined,
                        Password: undefined,
                        Visible: false,
                        NAT: 1,
                        Isolation: 0,
                    }
                }
            },
            _5G7: {
                Power: false,
                SSID: "edge-development-5g",
                AutoSSID: false,
                Visible: true,
                Channel: 136,
                Password: "testtest",
                NAT: 1,
                Isolation: 0,
                Aux: {
                    "0": {
                        Power: false,
                        SSID: undefined,
                        Password: undefined,
                        Visible: false,
                        NAT: 1,
                        Isolation: 0,
                    }
                }
            }
        };
        this._apply2G4 = function (mod, cb) {
            if (!mod || Object.keys(mod).length == 0)
                return cb();
            if (!has(mod, "_2G4")) {
                return cb();
            }
            mod = mod._2G4;
            if (has(mod, "SSID")) {
                exports.WLAN_2G4.Config.SSID = mod.SSID;
            }
            if (has(mod, "AutoSSID")) {
                if (mod.AutoSSID) {
                    exports.WLAN_2G4.Config.SSID = Network.Config.Get().NetworkName;
                }
                else {
                    exports.WLAN_2G4.Config.SSID = mod.SSID ? mod.SSID : _this.Get()._2G4.SSID;
                }
            }
            if (has(mod, "Visible")) {
                exports.WLAN_2G4.Config.BroadcastSSID = mod.Visible;
            }
            if (has(mod, "Password")) {
                exports.WLAN_2G4.Config.Password = mod.Password;
            }
            if (has(mod, "Channel")) {
                exports.WLAN_2G4.Config.Channel = mod.Channel;
            }
            if (has(mod, "NAT")) {
                exports.Rules.NAT_2G4.Target = mod.NAT == 1 ? 0 /* ACCEPT */ : 1 /* DROP */;
                exports.Rules.NAT_2G4.Save(function () {
                });
            }
            if (mod.Power == false) {
                exports.WLAN_2G4.Stop(false);
                return cb();
            }
            else if (_this.Get()._2G4.Power) {
                exports.WLAN_2G4.Start(true);
                var pid;
                var job1 = setTimeout(function () {
                    if (exports.WLAN_2G4.Process) {
                        pid = exports.WLAN_2G4.Process.pid;
                    }
                    clearTimeout(job1);
                }, 1000);
                var job2 = setTimeout(function () {
                    clearTimeout(job2);
                    if (exports.WLAN_2G4.Process && exports.WLAN_2G4.Process.pid == pid) {
                        return cb();
                    }
                    cb(new Error("Failed to Config WLAN_2G4"));
                }, 3000);
            }
        };
        this._apply5G7 = function (mod, cb) {
            if (!mod || Object.keys(mod).length == 0)
                return cb();
            if (!has(mod, "_5G7")) {
                return cb();
            }
            mod = mod._5G7;
            if (has(mod, "SSID")) {
                exports.WLAN_5G7.Config.SSID = mod.SSID;
            }
            if (has(mod, "AutoSSID")) {
                if (mod.AutoSSID) {
                    exports.WLAN_5G7.Config.SSID = Network.Config.Get().NetworkName;
                }
                else {
                    exports.WLAN_5G7.Config.SSID = mod.SSID ? mod.SSID : _this.Get()._5G7.SSID + "_5G";
                }
            }
            if (has(mod, "Visible")) {
                exports.WLAN_5G7.Config.BroadcastSSID = mod.Visible;
            }
            if (has(mod, "Password")) {
                exports.WLAN_5G7.Config.Password = mod.Password;
            }
            if (has(mod, "Channel")) {
                exports.WLAN_5G7.Config.Channel = mod.Channel;
            }
            if (has(mod, "NAT")) {
                exports.Rules.NAT_5G7.Target = mod.NAT == 1 ? 0 /* ACCEPT */ : 1 /* DROP */;
                exports.Rules.NAT_5G7.Save(function () {
                });
            }
            if (mod.Power == false) {
                exports.WLAN_5G7.Stop(false);
                return cb();
            }
            else if (_this.Get()._5G7.Power) {
                exports.WLAN_5G7.Start(true);
                var pid;
                var job1 = setTimeout(function () {
                    if (exports.WLAN_5G7.Process) {
                        pid = exports.WLAN_5G7.Process.pid;
                    }
                    clearTimeout(job1);
                }, 1000);
                var job2 = setTimeout(function () {
                    clearTimeout(job2);
                    if (exports.WLAN_5G7.Process && exports.WLAN_5G7.Process.pid == pid) {
                        return cb();
                    }
                    cb(new Error("Failed to Config WLAN_5G7"));
                }, 3000);
            }
        };
        this._apply = function (mod, raw, cb) {
            async.series([
                _this._apply2G4.bind(_this, mod),
            ], cb);
        };
        this.Initialize = function (cb) {
            _this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "WIFI");
            _this.Reload(_this.Default, cb);
        };
    }
    return Configuration;
})(Abstract.Configurable);
exports.Config = new Configuration();
__API(withCb(exports.Config.Get), "Network.Wifi.Config.Get", [11 /* Network */, 12 /* Configuration */]);
__API(exports.Config.Apply, "Network.Wifi.Config.Apply", [11 /* Network */, 12 /* Configuration */]);
