//import _Status = require('../Status');
//import Status = _Status.Status;
import ConfMgr = require('../ConfMgr');

class ProcessEnd {

    apply = (mod, cb) => {
    };

    private default_conf = {
        NetworkName: "edge-dev",
        RouterIP: "192.168.133.1",
        LocalNetmask: 24,
        Uplink: CONF.DEV.ETH.DEV_WAN, //ethernet
        DHCPHosts: {}
    };

    constructor() {
        var conf = ConfMgr.Register('wifi', this.default_conf);

        conf.on('commit',  (mod, _old) => {
            this.apply(mod, (err) => {
                if (err) conf.Error(err);
                else conf.Flush();
            });
        });

        this.apply(conf, (err) => {
            if (err) conf.Error(err);
            else conf.Flush();
        });
    }

}