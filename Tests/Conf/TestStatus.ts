require('../../System/Env');

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

        pub.devices.Set('00:11:ff:aa:bb:cc', {
            ip: 1,
            dage: 1,
            xiaodi: 2
        });

        pub.Set('internet', false);
        console.log(sub.devices['00:11:ff:aa:bb:cc'].ValueOf());

        pub.Set('hollyShit', {
            name: 'crap'
        });

    });

    it('Status Get by ValueOf()', ()=>{
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
        pub.mdns.Set('12345', {'holly': 'shit', 'crap': {'yes': 1}});
        pub.ssdp.Set('12345', {'running': 'crap'});

        var sub = StatMgr.Get('network');
        var valueOf = sub.ValueOf();
        valueOf.should.not.have.property('ValueOf');
        valueOf.should.not.have.property('_warp');
    });
});
