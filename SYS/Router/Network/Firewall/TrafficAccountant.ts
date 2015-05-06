import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import path = require('path');

export var Devices:{ [key:string]: any } = {};

//export interface IDHCPLease {
//    Mac: string;
//    Address: string;
//    Hostname: string;
//    VendorClass: string;
//    Interface: string;
//}

export class Traffic {
    Packets:number = 0;
    Bytes:number = 0;
    Delta_Bytes:number = 0;
    Delta_Packets:number = 0;
    Delta_Time:number = 0;
    Row_Number:number = 0;
    Name:string = "";
}


class Configuration extends Configurable {
    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);
    }

    _apply = (delta, original, cb) => {
        cb();
    }
}

var defaultConfig = {};

function setTraffic(networkAddress) {
    trace('set traffic rules.', networkAddress);
    var iptables = 'iptables'
        , internet_up_traffic = 'internet_up_traffic'
        , internet_down_traffic = 'internet_down_traffic'
        , intranet_traffic = 'intranet_traffic';
    exec(iptables, '-w', '-t', 'filter', '-R', 'FORWARD', '1', '-s', networkAddress, '-o', CONF.DEV.ETH.DEV_WAN, '-j', internet_up_traffic);
    exec(iptables, '-w', '-t', 'filter', '-R', 'FORWARD', '2', '-d', networkAddress, '-i', CONF.DEV.ETH.DEV_WAN, '-j', internet_down_traffic);
    exec(iptables, '-w', '-t', 'filter', '-R', 'FORWARD', '3', '-s', networkAddress, '-d', networkAddress, '-j', intranet_traffic);
}

export function Initialize(cb) {
    var confTraffic = new Configuration(SECTION.TRAFFIC, defaultConfig);
    confTraffic.Initialize(cb);

    __API(withCb(confTraffic.ConfigHandler.Get), "Network.Traffic.Config.Get", [Permission.Network, Permission.Configuration]);

    //var cmd = 'sh ' + path.join(process.env.ROOT_PATH, 'Scripts/Router/Network/traffic.sh');
    //warn('traffic sh', cmd);
    //var parser = parsespawn(cmd, []);
    //parser.on("out_line", (line) => {
    //    var traffic = JSON.parse(line);
    //
    //});
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.NETWORK);
    sub.devices.on('set', (key, oldValue, newValue) => {
        if (key === 'DEVICE_DELETED') {
                var leaseDeleted = newValue;
                if (Devices[leaseDeleted.Mac]) {
                    delete Devices[leaseDeleted.Mac];
                }
            }
            if (key === 'DEVICE_ADDED') {
                var leaseAdded:any = newValue;
                Devices[leaseAdded.Mac] = leaseAdded;
            }
            if (key === 'DEVICE_CHANGED') {
                var leaseChanged:any = newValue;
                Devices[leaseChanged.Mac] = leaseChanged;
            }
    });
    sub.network.on('set', (key, oldValue, network)=>{
        if (has(network, 'NetworkAddress')) {
            setTraffic(network.NetworkAddress);
        }
    });
    cb();
}