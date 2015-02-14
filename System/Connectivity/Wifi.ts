import Node = require("Node");
import Core = require("Core");
import Native = Core.SubSys.Native;
import Iptables = Native.iptables;
import Abstract = Core.Lib.Abstract;

class _wifi extends Abstract.Configurable {

    WLAN_2G4: Native.hostapd.hostapd = new Native.hostapd.hostapd(CONF.DEV.WLAN.DEV_2G);
    WLAN_5G7: Native.hostapd.hostapd = new Native.hostapd.hostapd(CONF.DEV.WLAN.DEV_5G);

    NAT_2G4: Iptables.Rule = new Iptables.Rule();
    NAT_5G7: Iptables.Rule = new Iptables.Rule();

    //TODO: Optimize 5G7's Config (VF* Configs - Hostapd 80211AC)

    Default = {
        _2G4: {
            Power: true,
            SSID: "_Beyond_Edge_",
            AutoSSID: true,
            Visible: true,
            Channel: 8,
            Password: undefined,
            NAT: 1,
            Isolation: 0, //Not Used, reserved for VLAN,
            Aux: { //GuestWifi
                "0": {
                    Power: false,
                    SSID: undefined,
                    Password: undefined,
                    Visible: false,
                    NAT: 1,
                    Isolation: 0, //Not Used, reserved for VLAN,
                }
            }
        },
        _5G7: {
            Power: true,
            SSID: "_Beyond_Edge_5G",
            AutoSSID: true,
            Visible: true,
            Channel: 136,
            Password: undefined,
            NAT: 1,
            Isolation: 0, //Not Used, reserved for VLAN,
            Aux: { //GuestWifi
                "0": {
                    Power: false,
                    SSID: undefined,
                    Password: undefined,
                    Visible: false,
                    NAT: 1,
                    Isolation: 0, //Not Used, reserved for VLAN,
                }
            }
        }
    };

    constructor() {
        super();
    }

    private _apply2G4 = (mod, cb) => {
        if (!mod || Object.keys(mod).length == 0) return cb();
        if (!has(mod, "_2G4")) {
            return cb();
        }
        mod = mod._2G4;
        //console.log(mod);
        if (has(mod, "SSID")) {
            this.WLAN_2G4.Config.SSID = mod.SSID;
        }
        if (has(mod, "AutoSSID")) {
            if (mod.AutoSSID) {
                this.WLAN_2G4.Config.SSID = Core.Connectivity.LocalNetwork.Config().NetworkName; //override :p
            } else {
                this.WLAN_2G4.Config.SSID = mod.SSID ? mod.SSID : this.Config()._2G4.SSID; //override :p
            }
        }
        if (has(mod, "Visible")) {
            this.WLAN_2G4.Config.BroadcastSSID = mod.Visible;
        }
        if (has(mod, "Password")) {
            this.WLAN_2G4.Config.Password = mod.Password;
        }
        if (has(mod, "Channel")) {
            this.WLAN_2G4.Config.Channel = mod.Channel;
        }
        if (has(mod, "NAT")) {
            this.NAT_2G4.Target = mod.NAT == 1 ? Iptables.Target_Type.ACCEPT : Iptables.Target_Type.DROP;
            this.NAT_2G4.Save(() => { });
        }
        if (mod.Power == false) {
            //Arrrrhhhhhhhhhhhhhhhhhhooooouuuuuchh..
            this.WLAN_2G4.Stop(false);
            return cb();
        }
        else {
            //apply
            this.WLAN_2G4.Start(true);
            var pid;

            var job1 = setTimeout(() => {
                if (this.WLAN_2G4.Process) {
                    pid = this.WLAN_2G4.Process.pid;
                }
                clearTimeout(job1);
            }, 1000);

            var job2 = setTimeout(() => {
                clearTimeout(job2);
                if (this.WLAN_2G4.Process && this.WLAN_2G4.Process.pid == pid) {
                    return cb();
                }
                cb(new Error("Failed to Config WLAN_2G4"));
            }, 3000);
        }
    };

    private _apply5G7 = (mod, cb) => {
        if (!mod || Object.keys(mod).length == 0) return cb();
        if (!has(mod, "_5G7")) {
            return cb();
        }
        mod = mod._5G7;
        //console.log(mod);
        if (has(mod, "SSID")) {
            this.WLAN_5G7.Config.SSID = mod.SSID;
        }
        if (has(mod, "AutoSSID")) {
            if (mod.AutoSSID) {
                this.WLAN_5G7.Config.SSID = Core.Connectivity.LocalNetwork.Config().NetworkName; //override :p
            } else {
                this.WLAN_5G7.Config.SSID = mod.SSID ? mod.SSID : this.Config()._5G7.SSID + "_5G"; //override :p
            }
        }
        if (has(mod, "Visible")) {
            this.WLAN_5G7.Config.BroadcastSSID = mod.Visible;
        }
        if (has(mod, "Password")) {
            this.WLAN_5G7.Config.Password = mod.Password;
        }
        if (has(mod, "Channel")) {
            this.WLAN_5G7.Config.Channel = mod.Channel;
        }
        if (has(mod, "NAT")) {
            this.NAT_5G7.Target = mod.NAT == 1 ? Iptables.Target_Type.ACCEPT : Iptables.Target_Type.DROP;
            this.NAT_5G7.Save(() => { });
        }
        if (mod.Power == false) {
            //Arrrrhhhhhhhhhhhhhhhhhhooooouuuuuchh..
            this.WLAN_5G7.Stop(false);
            return cb();
        }
        else {
            //apply
            this.WLAN_5G7.Start(true);
            var pid;

            var job1 = setTimeout(() => {
                if (this.WLAN_5G7.Process) {
                    pid = this.WLAN_5G7.Process.pid;
                }
                clearTimeout(job1);
            }, 1000);

            var job2 = setTimeout(() => {
                clearTimeout(job2);
                if (this.WLAN_5G7.Process && this.WLAN_5G7.Process.pid == pid) {
                    return cb();
                }
                cb(new Error("Failed to Config WLAN_5G7"));
            }, 3000);
        }
    };

    protected _apply = (mod, cb: Callback) => {
        async.series([
            this._apply2G4.bind(this, mod),
            this._apply5G7.bind(this, mod)
        ], cb);
    };

    public Initialize = (cb) => {
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "WIFI");
        this.NAT_2G4.Target = this.NAT_5G7.Target = Iptables.Target_Type.ACCEPT;
        this.NAT_5G7.Iface_In = this.NAT_2G4.Iface_In = {
            Prefix: CONF.DEV.WLAN.DEV_2G,
            Id: <any>"" //SKIP
        };
        async.series([
            Native.iptables.Iptables.NAT.PREROUTING.Add.bind(null, this.NAT_2G4),
            Native.iptables.Iptables.NAT.PREROUTING.Add.bind(null, this.NAT_5G7),
            this.Reload.bind(null, this.Default)
        ], cb);
    };


}

var _export = new _wifi();
export = _export;


