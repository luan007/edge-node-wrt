var fs = require('fs');
require('../System/Env');
var ConfMgr = require('../System/Conf/ConfMgr');

describe('Configuration Manager Testing', () => {
    var applyOkAlways = (cb:Function) => {
        cb();
    }

    before(()=> {
        ConfMgr.Initialize();
    });

    it('mock default config updating', (done) => {
        var default_conf = {
            NetworkName: "edge-dev",
            RouterIP: "192.168.133.1",
            LocalNetmask: 24,
            Uplink: CONF.DEV.ETH.DEV_WAN, //ethernet
            DHCPHosts: {}
        };

        var confWifi = ConfMgr.Register('wifi', default_conf);
        confWifi.should.be.ok;
        confWifi.on('commit', (delta, original) => {
            info('delta:', delta);
            trace('oldAll', original);
            applyOkAlways(() => {

                confWifi.Flush();

                setTimeout(()=> { // check file
                    fs.existsSync(ConfMgr.CONFIG_PATH).should.be.true;

                    var json = fs.readFileSync(ConfMgr.CONFIG_PATH);
                    var confOnDisk = JSON.parse(json.toString('utf8'));
                    confOnDisk.should.be.ok;

                    confOnDisk['wifi'].should.be.ok;
                    confOnDisk['wifi'].should.eql(default_conf);

                    done();
                }, 1000);
            });
        });

        ConfMgr.Set('wifi', {'NetworkName': 'edge-DEV', 'RouterIP': '12.12.12.12'});
        ConfMgr.Commit();
    });
});