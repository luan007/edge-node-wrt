import hostapd = require('../../../Common/Native/hostapd');
import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;

var Hostapd2G4 = new hostapd.hostapd(CONF.DEV.WLAN.DEV_2G);
var Hostapd5G7 = new hostapd.hostapd(CONF.DEV.WLAN.DEV_5G);

var pub2G4 = StatMgr.Pub(SECTION.WLAN2G, {
    stations: {},
    devices: {}
});
var pub5G7 = StatMgr.Pub(SECTION.WLAN5G, {
    stations: {},
    devices: {}
});

var scriptPath = path.join(process.env.ROOT_PATH, 'Scripts/Router/Network/iw_station.sh')
    , jobName = 'iw_station_dump';

interface Station {
    inactive_time?:number;
    rx_bytes?:number;
    rx_packets?:number;
    tx_bytes?:number;
    tx_packets?:number;
    tx_retries?: number;
    tx_failed?: number;
    signal?: number;
    signal_avg?: number;
    tx_bitrate?:string;
    authorized?:boolean;
    authenticated?:boolean;
    preamble?:string;
    WMMWME?:boolean;
    MFP?:boolean;
    TDLS_peer?:boolean;

    rx_bytes_delta?:number;
    rx_packets_delta?:number;
    tx_bytes_delta?:number;
    tx_packets_delta?:number;
    tx_retries_delta?: number;
    tx_failed_delta?: number;
    LastMeasure?: number;
    Delta_Time?:number;
    ap?:string;
}

//mac: [Station]
export var Stations2G4:IDic<Station> = {};
export var Stations5G7:IDic<Station> = {};
var delta2GStations = [],
    delta5GStations = [];

class Configuration extends Configurable {
    private hostapdInstance:hostapd.hostapd;

    //TODO: Optimize 5G7's Config (VF* Configs - Hostapd 80211AC)
    constructor(moduleName:string, hostapd:hostapd.hostapd, defaultConfig:any) {
        super(moduleName, defaultConfig);
        this.hostapdInstance = hostapd;
    }

    _apply = (delta, orginal, cb) => {
        //console.log(mod);
        if (has(delta, "Bridge")) {
            this.hostapdInstance.Config.Bridge = delta.Bridge;
        }
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
    Bridge: CONF.DEV.WLAN.WLAN_BR,
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
    Bridge: CONF.DEV.WLAN.WLAN_BR,
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

function extractIWStationDump(stationsContainer, iwStationsDump, ap, deltaArray, cb) {
    intoQueue(jobName, ()=> {
        for (var mac in iwStationsDump) {
            stationsContainer[mac] = stationsContainer[mac] || {};
            if (stationsContainer[mac].rx_bytes) {
                stationsContainer[mac].rx_bytes_delta = iwStationsDump[mac].rx_bytes - stationsContainer[mac].rx_bytes;
            }
            if (stationsContainer[mac].rx_packets) {
                stationsContainer[mac].rx_packets_delta = iwStationsDump[mac].rx_packets - stationsContainer[mac].rx_packets;
            }
            if (stationsContainer[mac].tx_bytes) {
                stationsContainer[mac].tx_bytes_delta = iwStationsDump[mac].tx_bytes - stationsContainer[mac].tx_bytes;
            }
            if (stationsContainer[mac].tx_packets) {
                stationsContainer[mac].tx_packets_delta = iwStationsDump[mac].tx_packets - stationsContainer[mac].tx_packets;
            }
            if (stationsContainer[mac].tx_packets) {
                stationsContainer[mac].tx_packets_delta = iwStationsDump[mac].tx_packets - stationsContainer[mac].tx_packets;
            }
            if (stationsContainer[mac].tx_retries) {
                stationsContainer[mac].tx_retries_delta = iwStationsDump[mac].tx_retries - stationsContainer[mac].tx_retries;
            }
            if (stationsContainer[mac].tx_retries) {
                stationsContainer[mac].tx_retries_delta = iwStationsDump[mac].tx_retries - stationsContainer[mac].tx_retries;
            }
            if (stationsContainer[mac].tx_failed) {
                stationsContainer[mac].tx_failed_delta = iwStationsDump[mac].tx_failed - stationsContainer[mac].tx_failed;
            }
            if (stationsContainer[mac].LastMeasure) {
                stationsContainer[mac].Delta_Time = new Date().getTime() - stationsContainer[mac].LastMeasure;
            }
            stationsContainer[mac].ap = ap;
            stationsContainer[mac].LastMeasure = new Date().getTime();
            for (var k in iwStationsDump[mac]) {
                if (iwStationsDump[mac].hasOwnProperty(k)) {
                    if (stationsContainer[mac][k] !== iwStationsDump[mac][k] && deltaArray.indexOf(mac) === -1) {
                        deltaArray.push(mac);
                    }
                    stationsContainer[mac][k] = iwStationsDump[mac][k];
                }
            }
        }
    }, cb);
}

function parseIWStationDump() {
    exec('sh', scriptPath, (err, res)=> {
        if (err) error(err);
        else {
            var json = res.replace(/^\}\,/gmi, '').replace(/\,\}/gmi, '}')
                .replace(/yes/gmi, 'true').replace(/no/gmi, 'false')
                .replace(/"preamble":([^,]+)/gmi, '"preamble":"$1"').replace(/"tx_bitrate":([^,]+)/gmi, '"tx_bitrate":"$1"');
            //info('parse IW', json, res);
            try {
                var iwStations = JSON.parse(json);
                //trace('parse iw station dump', require('util').inspect(iwStations));

                delta2GStations.length = 0;
                if (Object.keys(iwStations[CONF.DEV.WLAN.DEV_2G]).length > 0) {
                    extractIWStationDump(Stations2G4, iwStations[CONF.DEV.WLAN.DEV_2G], CONF.DEV.WLAN.DEV_2G, delta2GStations, ()=> {
                        for (var i = 0, len = delta2GStations.length; i < len; i++) {
                            var mac = delta2GStations[i];
                            pub2G4.stations.Set(mac, Stations2G4[mac]);
                        }
                        delta2GStations.length = 0;
                    });
                }
                delta5GStations.length = 0;
                if (Object.keys(iwStations[CONF.DEV.WLAN.DEV_5G]).length > 0) {
                    extractIWStationDump(Stations5G7, iwStations[CONF.DEV.WLAN.DEV_5G], CONF.DEV.WLAN.DEV_5G, delta5GStations, ()=> {
                        for (var i = 0, len = delta5GStations.length; i < len; i++) {
                            var mac = delta5GStations[i];
                            pub5G7.stations.Set(mac, Stations5G7[mac]);
                        }
                        delta5GStations.length = 0;
                    });
                }
            } catch (err) {
                error(err);
            }
        }
    });
}

function watchDevices(hostapdInstances, publishers) {
    for (var i = 0, len = hostapdInstances.length; i < len; i++) {
        ((_i) => {
            hostapdInstances[_i].Ctrl.on("event", (type, mac:string) => {
                if (type == "AP-STA-CONNECTED") {
                    publishers[_i].devices.Set(mac, true); //online
                } else if (type == "AP-STA-DISCONNECTED") {
                    publishers[_i].devices.Set(mac, false); //offline
                }
            });
        })(i);
    }
}

export function Initialize(cb) {
    watchDevices([Hostapd2G4, Hostapd5G7], [pub2G4, pub5G7]);

    var config2G4 = new Configuration(SECTION.WLAN2G, Hostapd2G4, defconfig2G4);
    var config5G7 = new Configuration(SECTION.WLAN5G, Hostapd5G7, defconfig5G7);

    async.series([
        (cb) => {
            config2G4.Initialize(cb);
        },
        (cb) => {
            config5G7.Initialize(cb);
        },
        (cb)=> {
            setJob(jobName, parseIWStationDump, CONF.IW_STATION_DUMP_INTERVAL);
            cb();
        }
    ], cb);

    __API(withCb(config2G4.ConfigHandler.Get), "Network.Wifi2G.Config.Get", [Permission.Network, Permission.Configuration]);
    __API(withCb(config5G7.ConfigHandler.Get), "Network.Wifi5G.Config.Get", [Permission.Network, Permission.Configuration]);
}

export function Diagnose(callback:Callback) {
    setTask('stability_check_wifi', ()=> {
        var jobs = [];
        jobs.push((cb) => {
            Hostapd2G4.StabilityCheck(cb)
        });
        jobs.push((cb) => {
            Hostapd5G7.StabilityCheck(cb)
        });
        async.series(jobs, (err, results)=> {
            if (err) return callback(err);
            return callback(null, true);
        });
    }, 5000);
}

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
export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.NETWORK);
    sub.network.on('NetworkName', (oldValue, newValue) => {
        SetSSID(Hostapd2G4, SECTION.WLAN2G, newValue, ()=> {
        });
        SetSSID(Hostapd5G7, SECTION.WLAN5G, newValue, ()=> {
        });
    });
    cb();
}