import hostapd = require('../../../Common/Native/hostapd');
import Iptables = require('../../../Common/Native/iptables');
import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import Status = require('../../../Common/Stat/Status');
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;

export var WLAN_2G4 = new hostapd.hostapd(CONF.DEV.WLAN.DEV_2G);
export var WLAN_5G7 = new hostapd.hostapd(CONF.DEV.WLAN.DEV_5G);

class Configuration extends Configurable {
    private hostapdInstance:hostapd.hostapd;

    //TODO: Optimize 5G7's Config (VF* Configs - Hostapd 80211AC)
    constructor(moduleName:string, hostapd:hostapd.hostapd, defaultConfig:any) {
        super(moduleName, defaultConfig);
        this.hostapdInstance = hostapd;
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
                this.hostapdInstance.Config.SSID = delta.SSID ? delta.SSID : this.ConfigHandler.Get()['SSID']; //override :p
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
        else if (this.ConfigHandler.Get()['Power']) {
            //apply
            this.hostapdInstance.Start(true);

            this.hostapdInstance.StabilityCheck(cb);
        }
    };
}

var defconfig2G4 = {
    Power: true,
    SSID: "EdgeTractor",
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

var defconfig5G7 = {
    Power: true,
    SSID: "EdgeTractor_5G",
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

/**
 * SET SSID of the hostapd instance
 * @param hostapdInstance
 * @param sectionName
 * @param ssid
 * @param cb
 * @constructor
 */
function SetSSID(hostapdInstance:hostapd.hostapd, sectionName, ssid, cb:Callback) {
    warn('SetSSID');
    var conf = ConfMgr.Get(sectionName);
    if (conf && conf.AutoSSID) {
        warn('INTO SetSSID', conf);
        hostapdInstance.Config.SSID = ssid
        if (conf.Power) {
            hostapdInstance.Start(true);
            hostapdInstance.StabilityCheck(cb);
        }
    }
}

export function Initialize(cb) {
    var config2G4 = new Configuration(SECTION.WLAN2G, WLAN_2G4, defconfig2G4);
    var config5G7 = new Configuration(SECTION.WLAN5G, WLAN_5G7, defconfig5G7);

    async.series([
        (cb) => {
            config2G4.Initialize(cb);
        },
        (cb) => {
            config5G7.Initialize(cb);
        }
    ], cb);

    __API(withCb(config2G4.ConfigHandler.Get), "Network.Wifi2G.Config.Get", [Permission.Network, Permission.Configuration]);
    __API(withCb(config5G7.ConfigHandler.Get), "Network.Wifi5G.Config.Get", [Permission.Network, Permission.Configuration]);
}

export function Subscribe(cb) {
    StatMgr.Sub(SECTION.NETWORK, (moduleName, delta) => {
        if (has(delta, "NetworkName")) {
            SetSSID(WLAN_2G4, SECTION.WLAN2G, delta.NetworkName, ()=> {
            });
            SetSSID(WLAN_5G7, SECTION.WLAN5G, delta.NetworkName, ()=> {
            });
        }
        if (has(delta, "RouterIP")) {
            warn('delta.RouterIP', delta.RouterIP);
            exec("ifconfig", CONF.DEV.WLAN.DEV_2G, delta.RouterIP/* + "/" + addr.Prefix*/);
            exec("ifconfig", CONF.DEV.WLAN.DEV_5G, delta.RouterIP/* + "/" + addr.Prefix*/);
        }
    });
    cb();
}