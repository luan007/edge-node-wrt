var fs = require('fs');
require('../System/Env');
var ConfMgr = require('../System/Conf/ConfMgr');

describe('Configuration Manager Testing', () => {
    var applyOkAlways = (cb:Function) => {
        cb();
    }

    before(()=> {
        if(!fs.existsSync(ConfMgr.CONFIG_PATH))
            fs.writeFileSync(ConfMgr.CONFIG_PATH, '{}');

        ConfMgr.Initialize();
    });

    it ('mock default config updating', (done) => {
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
            applyOkAlways(() => {

                confWifi.Flush(); // persistance

                setTimeout(()=> { // check file
                    fs.existsSync(ConfMgr.CONFIG_PATH).should.be.true;

                    //var json = fs.readFileSync(ConfMgr.CONFIG_PATH);
                    //var confOnDisk = JSON.parse(json.toString('utf8'));
                    //confOnDisk.should.be.ok;

                    //confOnDisk['wifi'].should.be.ok;
                    //confOnDisk['wifi'].should.eql(default_conf);
                }, 10);
            });
        });

        // change request
        ConfMgr.Set('wifi', {'NetworkName': 'edge-DEV', 'RouterIP': '12.12.12.12'});
        ConfMgr.Commit();

        for (var i = 0; i < 99; i++) {
            ((_i) => {
                ConfMgr.Set('wifi', {'LocalNetmask': _i});
                ConfMgr.Commit();
            })(i);
        }

        setTask('test', () => {
            done();
        }, 2000);
    });
});