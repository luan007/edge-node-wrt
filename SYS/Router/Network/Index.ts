import ConfMgr = require('../../Common/Conf/ConfMgr');
import StatMgr = require('../../Common/Stat/StatMgr');
import Dnsmasq = require('../../Common/Native/Dnsmasq');
export var dnsmasq = new Dnsmasq.dnsmasq();

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


var config = ConfMgr.Register('network', defaultConfig);
config.on('commit', (delta, original) => {
    //TODO: fill out apply logic.
});

var emitter = StatMgr.Pub('network', 'network', 'network status');
