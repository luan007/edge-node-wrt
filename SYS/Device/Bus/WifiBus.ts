import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
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
        || (wlan5G7Status.stations[mac] &&  wlan5G7Status.stations[mac].ValueOf())
        || {};

    _wifiBus.DeviceUp(mac, {
        Addr: addr,
        Lease: lease,
        Wireless: station,
        Traffic: {},
        MDNS: {},
        SSDP: {},
        Band: band
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
        _wifiBus.DeviceUp(mac, {
            Addr: neigh
        });
    });
    subNetwork.arp.on('del', (mac, oldValue)=> {
        _wifiBus.DeviceUp(mac, {
            Addr: {}
        });
    });
    subNetwork.ssdp.on('set', (IP, oldValue, headers)=>{
        var mac = StatBiz.GetMacByIP(IP);
        info('ssdp set', IP, mac, headers);
    });
    subNetwork.ssdp.on('del', (IP, oldHeaders)=>{
        var mac = StatBiz.GetMacByIP(IP);
        info('ssdp del', IP, mac, oldHeaders);
    });
    subNetwork.mdns.on('set', (IP, oldValue, service)=>{
        var mac = StatBiz.GetMacByIP(IP);
        info('mdns set', IP, mac, service);
    });
    subNetwork.mdns.on('del', (IP, oldService)=>{
        var mac = StatBiz.GetMacByIP(IP);
        info('mdns del', IP, mac, oldService);
    });

    subNetwork.p0f.on('set', (IP, description) => {
        var mac = StatBiz.GetMacByIP(IP);
        fatal('P0F device emerge', IP, mac);
        __EMIT('P0F.device', description);
    });

    var subTraffic = StatMgr.Sub(SECTION.TRAFFIC);
    subTraffic.traffics.on('set', (mac, oldValue, traffic) => {
        _wifiBus.DeviceUp(mac, {
            Traffic: traffic
        });
    });

    var subWlan2G4 = StatMgr.Sub(SECTION.WLAN2G);
    subWlan2G4.devices.on('set', (mac, oldValue, online)=> {
        info('2G device ' + online ?  'up' : 'down', mac);
        online ? on_connect(mac, SECTION.WLAN2G) : _wifiBus.DeviceDrop(mac);
    });
    subWlan2G4.stations.on('set', (mac, oldValue, station)=> {
        info('2G station up', mac);
        _wifiBus.DeviceUp(mac, {
            Wireless: station
        });
    });

    var subWlan5G7 = StatMgr.Sub(SECTION.WLAN5G);
    subWlan5G7.devices.on('set', (mac, oldValue, online)=> {
        info('5G device  ' + online ?  'up' : 'down', mac);
        online ? on_connect(mac, SECTION.WLAN5G) : _wifiBus.DeviceDrop(mac);
    });
    subWlan5G7.stations.on('set', (mac, oldValue, station)=> {
        info('5G station up', mac);
        _wifiBus.DeviceUp(mac, {
            Wireless: station
        });
    });

    cb();
}

__EVENT('P0F.device', [Permission.Event]);


