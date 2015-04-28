import Node = require("Node");
import hostapd = require('../../../Common/Native/hostapd');
import Iptables = require('../../../Common/Native/iptables');
import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import Status = require('../../../Common/Stat/Status');

export var WLAN_2G4 = new hostapd.hostapd(CONF.DEV.WLAN.DEV_2G);
export var WLAN_5G7 = new hostapd.hostapd(CONF.DEV.WLAN.DEV_5G);

//export var Rules = {
//    NAT_2G4: new Iptables.Rule(),
//    NAT_5G7: new Iptables.Rule()
//};
//
//
//export function Initialize(cb) {
//    Rules.NAT_2G4.Target = Iptables.Target_Type.ACCEPT;
//    Rules.NAT_2G4.Iface_In = {
//        Prefix: CONF.DEV.WLAN.DEV_2G,
//        Id: <any>"" //SKIP
//    };
//    async.series([
//        Iptables.Iptables.NAT.PREROUTING.Add.bind(null, Rules.NAT_2G4)
//    ], cb);
//}

class Configuration extends Config {
    private hostapdInstance:hostapd.hostapd;

    //TODO: Optimize 5G7's Config (VF* Configs - Hostapd 80211AC)
    constructor(moduleName:string, hostapd:hostapd.hostapd, defaultConfig:any) {
        super(moduleName, defaultConfig);
        this.hostapdInstance = hostapd;

        this.Initialize(()=>{});
    }

    _apply = (delta, orginal, cb) => {
        //console.log(mod);
        if (has(delta, "SSID")) {
            this.hostapdInstance.Config.SSID = delta.SSID;
        }
        if (has(delta, "AutoSSID")) {
            if (delta.AutoSSID) {
                this.hostapdInstance.Config.SSID = ConfMgr.Get(SECTION.NETWORK)['NetworkName']; //override :p
            } else {
                this.hostapdInstance.Config.SSID = delta.SSID ? delta.SSID : this.Get().SSID; //override :p
            }
        }
        if (has(delta, "Visible")) {
            this.hostapdInstance.Config.BroadcastSSID = delta.Visible;
        }
        if (has(delta, "Password")) {
            this.hostapdInstance.Config.Password = delta.Password;
        }
        if (has(delta, "Channel")) {
            this.hostapdInstance.Config.Channel = delta.Channel;
        }
        //if (has(delta, "NAT")) {
        //TODO: emit to iptables (status)

        //Rules.NAT_2G4.Target = mod.NAT == 1 ? Iptables.Target_Type.ACCEPT : Iptables.Target_Type.DROP;
        //Rules.NAT_2G4.Save(() => {
        //});
        //}
        if (delta.Power == false) {
            //Arrrrhhhhhhhhhhhhhhhhhhooooouuuuuchh..
            this.hostapdInstance.Stop(false);
            return cb();
        }
        else if (this.Get()['Power']) {
            //apply
            this.hostapdInstance.Start(true);
            var pid;

            var job1 = setTimeout(() => {
                if (this.hostapdInstance.Process) {
                    pid = this.hostapdInstance.Process.pid;
                }
                clearTimeout(job1);
            }, 1000);

            var job2 = setTimeout(() => {
                clearTimeout(job2);
                if (this.hostapdInstance.Process && this.hostapdInstance.Process.pid == pid) {
                    return cb();
                }
                return cb(new Error("Failed to Config " + this.key));
            }, 3000);
        }
    };

    public Initialize = (cb) => {
        var _default = this.Get();
        this.Reload(_default, cb);
    };
}

var defconfig2G4 = {
    Power: true,
    SSID: "EdgeRouter",
    AutoSSID: false,
    Visible: true,
    Channel: 2,
    Password: "testtest",
    //NAT: 1,
    //Isolation: 0, //Not Used, reserved for VLAN,
    Aux: { //GuestWifi
        "0": {
            Power: false,
            SSID: undefined,
            Password: undefined,
            Visible: false
            //NAT: 1,
            //Isolation: 0, //Not Used, reserved for VLAN,
        }
    }
};
var config2G4 = new Configuration(SECTION.WLAN2G, WLAN_2G4, defconfig2G4);

var defconfig5G7 = {
    Power: true,
    SSID: "EdgeRouter_5G",
    AutoSSID: false,
    Visible: true,
    Channel: 4,
    Password: "testtest",
    //NAT: 1,
    //Isolation: 0, //Not Used, reserved for VLAN,
    Aux: { //GuestWifi
        "0": {
            Power: false,
            SSID: undefined,
            Password: undefined,
            Visible: false
            //NAT: 1,
            //Isolation: 0, //Not Used, reserved for VLAN,
        }
    }
};
var config5G7 = new Configuration(SECTION.WLAN5G, WLAN_5G7, defconfig5G7);


__API(withCb(config2G4.ConfigHandler.Get), "Network.Wifi2G.Config.Get", [Permission.Network, Permission.Configuration]);
__API(withCb(config5G7.ConfigHandler.Get), "Network.Wifi5G.Config.Get", [Permission.Network, Permission.Configuration]);