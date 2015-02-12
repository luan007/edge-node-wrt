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

    Default =  {
        _2G4: {
            Power: true,
            SSID: "_Beyond_Edge_",
            AutoSSID: true,
            Visible: true,
            Channel: 8,
            Password: undefined,
            NAT: 1,
            Isolation: 0, //Not Used, reserved for VLAN,
            Aux: {
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
        //_5G7
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

    protected _apply = (mod, cb: Callback) => {
        async.series([
            this._apply2G4.bind(this, mod)
        ], cb);
    };

    public Initialize = (cb) => {
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "WIFI");
        this.NAT_2G4.Target = Iptables.Target_Type.ACCEPT;
        this.NAT_2G4.Iface_In = {
            Prefix: CONF.DEV.WLAN.DEV_2G,
            Id: <any>"" //SKIP
        };
        async.series([
            Native.iptables.Iptables.NAT.PREROUTING.Add.bind(null, this.NAT_2G4),
            this.Reload.bind(null, this.Default)
        ], cb);
        //TODO: 5G7

        //setInterval(() => {
        //    warn("Flipping Wifi State..");
        //    this.Apply({
        //        _2G4: {
        //            Power: !this.Config()._2G4.Power
        //        }
        //    }, (err) => {
        //        if(err) error(err);
        //    });
        //}, 15000);
    };


}

var _export = new _wifi();
export = _export;


