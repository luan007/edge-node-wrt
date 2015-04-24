var fs = require('fs');
require('../System/Env');
var ConfMgr = require('../Modules/Shared/Conf/ConfMgr');

describe('Configuration Manager Testing', () => {
    var applyOkAlways = (cb:Function) => {
        cb();
    }

    before(()=>{
        ConfMgr.Initialize();
    });

    it('Default config updating mock', (done) => {
        var default_conf = {
            NetworkName: "edge-dev",
            RouterIP: "192.168.133.1",
            LocalNetmask: 24,
            Uplink: CONF.DEV.ETH.DEV_WAN, //ethernet
            DHCPHosts: {}
        };

        var conf = ConfMgr.Register('wifi', default_conf);
        conf.should.be.ok;

        applyOkAlways(() => {
            conf.Flush();

            setTimeout(()=> { // check file
                fs.existsSync(ConfMgr.CONFIG_PATH).should.be.true;

                var confOnDisk = JSON.parse(fs.readFileSync(ConfMgr.CONFIG_PATH));
                confOnDisk.should.be.ok;

                confOnDisk['wifi'].should.be.ok;
                confOnDisk['wifi'].should.eql(default_conf);

                done();
            }, 1000);

        });
    });
});