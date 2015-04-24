import _Status = require('../Status');
import Status = _Status.Status;
import ConfMgr = require('../ConfMgr');

(() => {
    ConfMgr.on('network', (current:Status, oldValue?:Status) => {
        // some ops...
        var network = {
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

        // notify StatusMgr
        current.Change(network);
    });
})();