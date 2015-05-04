import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import Status = require('../../../Common/Stat/Status');
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;

export class Traffic{
    Packets: number = 0;
    Bytes: number = 0;
    Delta_Bytes: number = 0;
    Delta_Packets: number = 0;
    Delta_Time: number = 0;
    Row_Number: number = 0;
    Name: string = "";
}

class Configuration extends Configurable {
    constructor(moduleName:string, defaultConfig:any){
        super(moduleName, defaultConfig);
    }
}

var defaultConfig = {

};

export function Initialize(cb) {
    var confTraffic = new Configuration(SECTION.TRAFFIC, defaultConfig);
    confTraffic.Initialize(cb);

    __API(withCb(confTraffic.ConfigHandler.Get), "Network.Traffic.Config.Get", [Permission.Network, Permission.Configuration]);
}

export function Subscribe(cb){
    StatMgr.Sub(SECTION.NETWORK, (moduleName, delta) => {
        if (has(delta, "DEVICE_DELETED")) {
            var leaseDeleted:any = delta.DEVICE_DELETED;
        }
        if (has(delta, "DEVICE_ADDED")) {
            var leaseAdded:any = delta.DEVICE_ADDED;
        }
        if (has(delta, "DEVICE_CHANGED")) {
            var leaseChanged:any = delta.DEVICE_CHANGED;
        }
    });
    cb();
}