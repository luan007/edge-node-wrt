require('../../System/Env');
var fs = require('fs');
var ConfMgr = require('../../SYS/Common/Conf/ConfMgr');

describe('Configuration Manager Testing', () => {
    before(()=> {
        if (!fs.existsSync(ConfMgr.CONFIG_PATH))
            fs.writeFileSync(ConfMgr.CONFIG_PATH, '{}');
    });

    it('mock default config updating', (done) => {
        var default_conf = {
            NetworkName: "edge-dev",
            RouterIP: "192.168.133.1",
            LocalNetmask: 24,
            Uplink: CONF.DEV.ETH.DEV_WAN, //ethernet
            DHCPHosts: {}
        };

        var confWifi:any = ConfMgr.Register(SECTION.NETWORK, default_conf);
        confWifi.should.be.ok;
        confWifi.on('commit', ()=>{
            confWifi.Flush(); // persist
        });

        // change request
        ConfMgr.Set(SECTION.NETWORK, {'NetworkName': 'edge-DEV', 'RouterIP': '12.12.12.12'});

        for (var i = 1; i < 99; i++) {
            ((_i) => {
                ConfMgr.Set(SECTION.NETWORK, {'LocalNetmask': _i});
                ConfMgr.Commit();
            })(i);
        }

        setTask('test', () => {
            var conf = ConfMgr.Get(SECTION.NETWORK);
            conf.LocalNetmask.should.be.ok;
            trace('LocalNetmask', conf.LocalNetmask);

            done();
        }, 1000);
    });
});