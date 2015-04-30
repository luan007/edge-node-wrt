import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import _Status = require('../../Common/Stat/Status');
import Status = _Status.Status;
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;

class Configuration extends Configurable {
    private emitter:Status;

    constructor(moduleName:string, defaultConfig:any, emitter:Status) {
        super(moduleName, defaultConfig);

        this.emitter = emitter;
    }

    _apply = (delta, orginal, cb) => {
        var stateChange:any = {};

        if (has(delta, "RouterIP")) {
            stateChange.RouterIP = delta.RouterIP;
        }
        if(has(delta, "LocalNetmask")){
            stateChange.LocalNetmask = delta.LocalNetmask;
        }
        if(Object.keys(stateChange).length){
            this.emitter.Emit(stateChange);
        }

        cb();
    }
}

var defaultConfig = {
    NetworkName: "edge-dev",
    RouterIP: "192.168.133.1",
    LocalNetmask: 24,
    Uplink: CONF.DEV.ETH.DEV_WAN, //ethernet
    DNS: [
        {
            UpStreamDNS: "114.114.114.114" //UpStreamPort: string; //Domains?: string[];
        },
        {
            UpStreamDNS: "8.8.8.8" //UpStreamPort: string; //Domains?: string[];
        }
    ],
    DHCPHosts: {}
};

var emitter = StatMgr.Pub(SECTION.NETWORK, SECTION.NETWORK, 'network status');
new Configuration(SECTION.NETWORK, defaultConfig, emitter);
