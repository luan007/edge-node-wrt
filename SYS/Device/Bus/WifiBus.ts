import Bus = require('./Bus');
import StatBiz = require('../../Common/Stat/StatBiz');

var _wifiBus = new Bus('WIFI');
function on_connect(mac, band) {
    if (!mac) return warn(" Invalid MAC - Skipped ");
    mac = mac.toLowerCase();
    var networkStatus = StatMgr.Get(SECTION.NETWORK);
    var addr = (networkStatus.arp[mac] && networkStatus.arp[mac].ValueOf()) || {};
    var lease = (networkStatus.leases[mac] && networkStatus.leases[mac].ValueOf()) || {};
    var wlan2G4Status = StatMgr.Get(SECTION.WLAN2G);
    var wlan5G7Status = StatMgr.Get(SECTION.WLAN5G);
    var station = (wlan2G4Status.stations[mac] && wlan2G4Status.stations[mac].ValueOf())
        || (wlan5G7Status.stations[mac] && wlan5G7Status.stations[mac].ValueOf())
        || {};

    _wifiBus.DeviceUp(mac, {
        Addr: addr,
        Lease: lease,
        Wireless: station,
        Traffic: {},
        MDNS: {},
        SSDP: {},
        Band: band,
        P0F: {}
    }, true);
}

export function Subscribe(cb) {
    var subNetwork = StatMgr.Sub(SECTION.NETWORK);
    subNetwork.leases.on('set', (mac, oldValue, leaseChanged) => {
        info('leases set', mac, leaseChanged);
        if (StatMgr.Get(SECTION.WLAN2G).devices[mac] || StatMgr.Get(SECTION.WLAN5G).devices[mac]) {
            _wifiBus.DeviceUp(mac,
                {
                    Lease: leaseChanged
                }
            );
        }
    });
    subNetwork.leases.on('del', (mac, oldValue) => {
        info('leases del', mac);
        _wifiBus.DeviceUp(mac, {
            Lease: {}
        });
    });
    subNetwork.arp.on('set', (mac, oldValue, neigh)=> {
        if(!StatBiz.GetIPByMac(mac)){
            return warn('non local area MAC', mac);
        }
        _wifiBus.DeviceUp(mac, {
            Addr: neigh
        });
    });
    subNetwork.arp.on('del', (mac, oldValue)=> {
        if(!StatBiz.GetIPByMac(mac)){
            return warn('non local area MAC', mac);
        }
        _wifiBus.DeviceUp(mac, {
            Addr: {}
        });
    });
    subNetwork.ssdp.on('set', (IP, oldValue, headers)=> {
        var mac = StatBiz.GetMacByIP(IP);
        if(mac) {
            info('ssdp set', IP, mac, headers);
            _wifiBus.DeviceUp(mac, {
                SSDP: headers
            });
        }
    });
    subNetwork.ssdp.on('del', (IP, oldHeaders)=> {
        var mac = StatBiz.GetMacByIP(IP);
        if(mac) {
            info('ssdp del', IP, mac, oldHeaders);
        }
    });
    subNetwork.mdns.on('set', (levelKey, oldValue, serviceMeta)=> {
        //console.log('mdns -------]]', levelKey);
        if (levelKey.indexOf('.') > -1) {
            var parts = levelKey.split('.');
            if (parts.length === 5) { //ip.typename
                var execResult = /(\d+.\d+.\d+.\d+)/gmi.exec(levelKey);
                if(execResult.length > 1) {
                    var IP = execResult[1];

                    var mac = StatBiz.GetMacByIP(IP);
                    if (mac) {
                        //console.log('mdns set', IP, mac, type, serviceMeta);
                        _wifiBus.DeviceUp(mac, {
                            MDNS: subNetwork.mdns[IP].ValueOf() //{  type: 'UP/DOWN', service: any }
                        });
                    }
                }
            }
        }
    });

    //subNetwork.p0f.on('set', (IP, oldValue, description) => {
    //    _wifiBus.DeviceUp(description.hwaddr, {
    //        P0F: description
    //    });
    //});

    var subTraffic = StatMgr.Sub(SECTION.TRAFFIC);
    subTraffic.traffics.on('set', (mac, oldValue, traffic) => {
        _wifiBus.DeviceUp(mac, {
            Traffic: traffic
        });
    });

    var subWlan2G4 = StatMgr.Sub(SECTION.WLAN2G);
    subWlan2G4.devices.on('set', (mac, oldValue, online)=> {
        info('2G device ' + online ? 'up' : 'down', mac);
        online ? on_connect(mac, SECTION.WLAN2G) : _wifiBus.DeviceDrop(mac);
    });
    subWlan2G4.stations.on('set', (mac, oldValue, station)=> {
        //console.log('2G station up'['cyanBG'].bold, mac);
        _wifiBus.DeviceUp(mac, {
            Wireless: station
        });
    });

    var subWlan5G7 = StatMgr.Sub(SECTION.WLAN5G);
    subWlan5G7.devices.on('set', (mac, oldValue, online)=> {
        info('5G device  ' + online ? 'up' : 'down', mac);
        online ? on_connect(mac, SECTION.WLAN5G) : _wifiBus.DeviceDrop(mac);
    });
    subWlan5G7.stations.on('set', (mac, oldValue, station)=> {
        //console.log('5G station up'['cyanBG'].bold, mac);
        _wifiBus.DeviceUp(mac, {
            Wireless: station
        });
    });

    cb();
}

//__EVENT('P0F.device', [Permission.Event]);


