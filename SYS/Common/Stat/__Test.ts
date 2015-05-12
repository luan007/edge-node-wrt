import StatMgr = require('./StatMgr');

function test() {
    var pub = StatMgr.Pub('network', {
        leases: {},
        arp: {},
        network: {},
        mdns: {},
        ssdp: {}
    });

    pub.leases.Set('12345', new Date().getTime());
    pub.arp.Set('12345', new Date().getTime());
    pub.network.Set('12345', new Date().getTime());
    pub.mdns.Set('12345', {'holly': 'shit'});
    pub.ssdp.Set('12345', {'running': 'crap'});

    var sub = StatMgr.Get('network');
    var valueOf = sub.ValueOf();
    console.log(require('util').inspect(valueOf));


    //var pub = StatMgr.Pub('NETWORK', {
    //    internet: true,
    //    settings: {
    //        name: "edge"
    //    },
    //    devices: {},
    //    hollyShit: {}
    //});
    //
    //var sub = StatMgr.Sub('NETWORK');
    //console.log('sub.internet', sub.internet);
    //console.log('sub.settings.name', sub.settings.name);
    //
    //sub.on('set', (key, oldValue, newValue)=> {
    //    console.log('set', key, oldValue, newValue);
    //});
    //
    //sub.on('devices.*', (key, oldValue, newValue)=> {
    //    console.log('devices.*', key, oldValue, newValue);
    //});
    //
    //sub.devices.on('distance', (oldValue, newValue) => {
    //    console.log('distance', oldValue, newValue);
    //});
    //
    //pub.devices.Set('00:11:ff:aa:bb:cc', {
    //    ip: 1,
    //    dage: 1,
    //    xiaodi: 2
    //});
    //
    //pub.devices.Set('distance', 10);
    //
    //pub.Set('internet', false);
    //console.log(sub.devices['00:11:ff:aa:bb:cc'].ValueOf());
    //
    //pub.Set('hollyShit', {
    //    name: 'crap'
    //});
    //
    //console.log('sub.hollyShit', sub.hollyShit.ValueOf());
    //
    //sub.hollyShit.on('set', (key, oldValue, newValue) => {
    //   console.log('[hollyShit.set]', key, oldValue, newValue);
    //});
    //
    //sub.hollyShit
    //
    //pub.Set('hollyShit', {
    //   name: 'wwwwwwfffffffddddddqqqqqjjjj'
    //});
}

test();