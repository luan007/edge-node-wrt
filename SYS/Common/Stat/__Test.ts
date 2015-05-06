import StatMgr = require('./StatMgr');

function test() {
    var pub = StatMgr.Pub('NETWORK', {
        internet: true,
        settings: {
            name: "edge"
        },
        devices: {},
        hollyShit: {}
    });

    var sub = StatMgr.Sub('NETWORK');
    console.log('sub.internet', sub.internet);
    console.log('sub.settings.name', sub.settings.name);

    sub.on('set', (key, oldValue, newValue)=> {
        console.log('set', key, oldValue, newValue);
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
    console.log(sub.devices['00:11:ff:aa:bb:cc'].valueOf());

    pub.set('hollyShit', {
        name: 'crap'
    });

    console.log('sub.hollyShit', sub.hollyShit.valueOf());
}

test();