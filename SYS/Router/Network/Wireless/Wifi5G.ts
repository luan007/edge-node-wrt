import Node = require("Node");
import Core = require("Core");
import Native = Core.SubSys.Native;
import Iptables = Native.iptables;
import Abstract = Core.Lib.Abstract;
import Network = require("../Network");

export var WLAN_5G7 = new Native.hostapd.hostapd(CONF.DEV.WLAN.DEV_5G);

export var Rules = {
    NAT_5G7: new Iptables.Rule()
};


export function Initialize(cb) {
    Rules.NAT_5G7.Target = Iptables.Target_Type.ACCEPT;
    Rules.NAT_5G7.Iface_In = {
        Prefix: CONF.DEV.WLAN.DEV_5G,
        Id: <any>"" //SKIP
    };
    async.series([
        Native.iptables.Iptables.NAT.PREROUTING.Add.bind(null, Rules.NAT_5G7),
        Config.Initialize
    ], cb);
}


class Configuration extends Abstract.Configurable {
    //TODO: Optimize 5G7's Config (VF* Configs - Hostapd 80211AC)
    Default = {
        _5G7: {
            Power: false,
            SSID: "edge-development-5g",
            AutoSSID: false,
            Visible: true,
            Channel: 136,
            Password: "testtest",
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

    private _apply5G7 = (mod, cb) => {
        if (!mod || Object.keys(mod).length == 0) return cb();
        if (!has(mod, "_5G7")) {
            return cb();
        }
        mod = mod._5G7;
        //console.log(mod);
        if (has(mod, "SSID")) {
            WLAN_5G7.Config.SSID = mod.SSID;
        }
        if (has(mod, "AutoSSID")) {
            if (mod.AutoSSID) {
                WLAN_5G7.Config.SSID = Network.Config.Get().NetworkName; //override :p
            } else {
                WLAN_5G7.Config.SSID = mod.SSID ? mod.SSID : this.Get()._5G7.SSID + "_5G"; //override :p
            }
        }
        if (has(mod, "Visible")) {
            WLAN_5G7.Config.BroadcastSSID = mod.Visible;
        }
        if (has(mod, "Password")) {
            WLAN_5G7.Config.Password = mod.Password;
        }
        if (has(mod, "Channel")) {
            WLAN_5G7.Config.Channel = mod.Channel;
        }
        if (has(mod, "NAT")) {
            Rules.NAT_5G7.Target = mod.NAT == 1 ? Iptables.Target_Type.ACCEPT : Iptables.Target_Type.DROP;
            Rules.NAT_5G7.Save(() => {
            });
        }
        if (mod.Power == false) {
            //Arrrrhhhhhhhhhhhhhhhhhhooooouuuuuchh..
            WLAN_5G7.Stop(false);
            return cb();
        }
        else if (this.Get()._5G7.Power) {
            //apply
            WLAN_5G7.Start(true);
            var pid;

            var job1 = setTimeout(() => {
                if (WLAN_5G7.Process) {
                    pid = WLAN_5G7.Process.pid;
                }
                clearTimeout(job1);
            }, 1000);

            var job2 = setTimeout(() => {
                clearTimeout(job2);
                if (WLAN_5G7.Process && WLAN_5G7.Process.pid == pid) {
                    return cb();
                }
                cb(new Error("Failed to Config WLAN_5G7"));
            }, 3000);
        }
    };

    protected _apply = (mod, raw, cb:Callback) => {
        async.series([
            this._apply5G7.bind(this, mod)
        ], cb);
    };

    public Initialize = (cb) => {
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "WIFI");
        this.Reload(this.Default, cb);
    };

}

export var Config = new Configuration();