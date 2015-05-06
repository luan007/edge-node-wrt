require('../../System/Env');
import StatMgr = require('../../SYS/Common/Stat/StatMgr');

describe('Configuration Manager Testing', () => {

    it('pub/sub mode', () => {

        var pub = StatMgr.Pub('NETWORK', {
            internet: true,
            settings: {
                name: "edge"
            },
            devices: {}
        });

        var sub = StatMgr.Sub('NETWORK');
        console.log('sub.internet', sub.internet);
        console.log('sub.settings.name', sub.settings.name);

        sub.on('set', (key, oldValue, newValue)=> {
            console.log(key, oldValue, newValue);
        });

        sub.on('devices.*', (key, oldValue, newValue)=> {
            console.log('devices.*', key, oldValue, newValue);
        });

        pub.devices.set('00:11:ff:aa:bb:cc', {
            ip: 1,
            dage: 1,
            xiaodi: 2
        });

        pub.set('internet', false);
        console.log(sub.devices['00:11:ff:aa:bb:cc']);

    });
});
