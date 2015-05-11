//import mdns = require('../../Common/Native/mdns_');
//import ssdp = require('../../Common/Native/ssdp');
import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import Bus = require('./Bus');
//
//class Wifi extends Bus {
//
//    constructor() {
//        super();
//    }
//
//    name = ():string => {
//        return "WLAN";
//    };
//
//    on_device = (dev) => {
//        this._on_device(dev);
//    }
//
//    _on_device_connect = (mac) => {
//        if (!mac) return warn(" Invalid MAC - Skipped ");
//        mac = mac.toLowerCase();
//
//        var networkStatus = StatMgr.Get(SECTION.NETWORK);
//        var addr = networkStatus.arp[mac] || {};
//        var lease = networkStatus.devices[mac] || {};
//        var wlan2G4Status = StatMgr.Get(SECTION.WLAN2G);
//        var wlan5G7Status = StatMgr.Get(SECTION.WLAN5G);
//        var station = wlan2G4Status.stations[mac] || wlan5G7Status.stations[mac] || {};
//
//        this._on_device({
//            hwaddr: mac,
//            data: {
//                Addr: addr,
//                Lease: lease,
//                Wireless: station,
//                Traffic: {},
//                MDNS: {},
//                SSDP: {}
//            }//OUI: OUI,
//        });
//        //});
//    };
//
//    _on_device_disconnect = (mac) => {
//        mac = mac.toLowerCase();
//        this._on_drop({
//            hwaddr: mac
//        });
//    };
//
//    _start = (cb) => {
//        //for (var i in this.HostapdInstances) {
//        //    if (!has(this.HostapdInstances, i)) continue;
//        //    ((i) => {
//        //
//        //        var drop_hostapd = () => {
//        //            for (var t in this._mac_list[i]) {
//        //                trace("Gracfully Removing " + t + ":" + i);
//        //                this._on_device_disconnect(i, t);
//        //            }
//        //        };
//        //
//        //        this.HostapdInstances[i].on("exit", drop_hostapd);
//        //        this.HostapdInstances[i].on("stop", drop_hostapd);
//        //
//        //        Core.SubSys.Native.iw.Attach(this.HostapdInstances[i].Dev);
//        //        this._mac_list[i] = {};
//        //        this.HostapdInstances[i].Ctrl.on("event", (type, mac:string) => {
//        //            if (type == "AP-STA-CONNECTED") {
//        //                this._on_device_connect(i, mac);
//        //            } else if (type == "AP-STA-DISCONNECTED") {
//        //                this._on_device_disconnect(i, mac);
//        //            }
//        //        });
//        //    })(i);
//        //}
//        cb();
//    };
//
//    _stop = (cb) => {
//        //for (var i in this.HostapdInstances) {
//        //    Core.SubSys.Native.iw.Detach(this.HostapdInstances[i].Dev);
//        //    this.HostapdInstances[i].Ctrl.removeAllListeners("event");
//        //}
//        cb();
//    };
//}

var _wifiBus = new Bus('WIFI');
function on_connect(mac, band) {
    if (!mac) return warn(" Invalid MAC - Skipped ");
    mac = mac.toLowerCase();
    var networkStatus = StatMgr.Get(SECTION.NETWORK);
    var addr = networkStatus.arp[mac] || {};
    var lease = networkStatus.devices[mac] || {};
    var wlan2G4Status = StatMgr.Get(SECTION.WLAN2G);
    var wlan5G7Status = StatMgr.Get(SECTION.WLAN5G);
    var station = wlan2G4Status.stations[mac] || wlan5G7Status.stations[mac] || {};

    _wifiBus.DeviceUp(mac, {
        Addr: addr,
        Lease: lease,
        Wireless: station,
        Traffic: {},
        MDNS: {},
        SSDP: {},
        Band: band
    });
    //});
}


export function Subscribe(cb) {

    var subNetwork = StatMgr.Sub(SECTION.NETWORK);
    subNetwork.devices.on('set', (mac, oldValue, leaseChanged) => {
        if (StatMgr.Get(SECTION.WLAN2G).devices[mac] || StatMgr.Get(SECTION.WLAN5G).devices[mac]) {
            _wifiBus.DeviceUp(mac,
                {
                    Lease: leaseChanged
                }
            );
        }

        //var currentIP = leaseChanged.Address;
        //mdns.Browser.Unwatch(currentIP);
        //mdns.Browser.Watch(currentIP,
        //    (service, mine) => {
        //        //add
        //        //TODO: change into mdns: { dead , alive }
        //        //      so that we can use driver interest to filter down mdns queries
        //        this._on_device({
        //            hwaddr: mac,
        //            data: {
        //                MDNS: mine
        //            }
        //        });
        //
        //    }, (service, mine) => {
        //        //del
        //        this._on_device({
        //            hwaddr: mac,
        //            data: {
        //                MDNS: mine
        //            }
        //        });
        //    });
        //
        //
        //ssdp.SSDP_Browser.Watch(currentIP,
        //    (service, mine) => {
        //        this._on_device({
        //            hwaddr: mac,
        //            data: {
        //                SSDP: mine
        //            }
        //        });
        //    }, (service, mine) => {
        //        this._on_device({
        //            hwaddr: mac,
        //            data: {
        //                SSDP: mine
        //            }
        //        });
        //    });
    });
    subNetwork.devices.on('del', (mac, oldValue) => {
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

    var subTraffic = StatMgr.Sub(SECTION.TRAFFIC);
    subTraffic.traffics.on('set', (mac, oldValue, traffic) => {
        _wifiBus.DeviceUp(mac, {
            Traffic: traffic
        });
    });

    var subWlan2G4 = StatMgr.Sub(SECTION.WLAN2G);
    subWlan2G4.devices.on('set', (mac, oldValue, online)=> {
        online ? on_connect(mac, SECTION.WLAN2G) : _wifiBus.DeviceDrop(mac);
    });
    subWlan2G4.stations.on('set', (mac, oldValue, station)=> {
        _wifiBus.DeviceUp(mac, {
            Wireless: station
        });
    });

    var subWlan5G7 = StatMgr.Sub(SECTION.WLAN5G);
    subWlan5G7.devices.on('set', (mac, oldValue, online)=> {
        online ? on_connect(mac, SECTION.WLAN5G) : _wifiBus.DeviceDrop(mac);
    });
    subWlan5G7.stations.on('set', (mac, oldValue, station)=> {
        _wifiBus.DeviceUp(mac, {
            Wireless: station
        });
    });

    cb();
}


