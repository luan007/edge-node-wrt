import iproute2 = require('../../Common/Native/iproute2');
import mdns = require('../../Common/Native/mdns_');
import ssdp = require('../../Common/Native/ssdp');
import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import Bus = require('./Bus');

class Wifi extends Bus {

    constructor() {
        super();
    }

    name = ():string => {
        return "WLAN";
    };

    _on_device_connect = (mac) => {
        if (!mac) return warn(" Invalid MAC - Skipped ");
        mac = mac.toLowerCase();

        iproute2.Neigh.WatchWithDev(CONF.DEV.WLAN.WLAN_BR, mac, (addr) => {
            this._on_device({
                hwaddr: mac,
                data: {
                    Addr: addr
                }
            });
        });

        var networkStatus = StatMgr.Get(SECTION.NETWORK); // Lease
        var lease = networkStatus.devices[mac];
        var currentIp = (networkStatus && networkStatus.devices && networkStatus.devices[mac]) ? networkStatus.devices[mac].Address : undefined;

        if (currentIp) {
            mdns.Browser.Watch(currentIp,
                (service, mine) => {
                    //add
                    //TODO: change into mdns: { dead , alive }
                    //      so that we can use driver interest to filter down mdns queries
                    this._on_device({
                        hwaddr: mac,
                        data: {
                            MDNS: mine
                        }
                    });

                }, (service, mine) => {
                    //del
                    this._on_device({
                        hwaddr: mac,
                        data: {
                            MDNS: mine
                        }
                    });
                });


            ssdp.SSDP_Browser.Watch(currentIp,
                (service, mine) => {
                    this._on_device({
                        hwaddr: mac,
                        data: {
                            SSDP: mine
                        }
                    });
                }, (service, mine) => {
                    this._on_device({
                        hwaddr: mac,
                        data: {
                            SSDP: mine
                        }
                    });
                });
        }

        this._on_device({
            hwaddr: mac,
            data: {
                Addr: iproute2.Neigh.Get(mac),
                Lease: StatMgr.Get(SECTION.NETWORK).devices[mac],
                Wireless: StatMgr.Get(SECTION.WLAN2G).stations[mac] || StatMgr.Get(SECTION.WLAN5G).stations[mac],
                Traffic: {},
                MDNS: {},
                SSDP: {}
            }//OUI: OUI,
        });
        //});
    };

    _on_device_disconnect = (mac) => {
        mac = mac.toLowerCase();
        this._on_drop({
            hwaddr: mac
        });
        iproute2.Neigh.Unwatch(mac);
        var networkStatus = StatMgr.Get(SECTION.NETWORK); // Lease
        var ip = (networkStatus && networkStatus.devices && networkStatus.devices[mac]) ? networkStatus.devices[mac].Address : undefined;
        if (ip) {
            mdns.Browser.Unwatch(ip);
            ssdp.SSDP_Browser.Unwatch(ip);
        }
    };


    _start = (cb) => {
        //for (var i in this.HostapdInstances) {
        //    if (!has(this.HostapdInstances, i)) continue;
        //    ((i) => {
        //
        //        var drop_hostapd = () => {
        //            for (var t in this._mac_list[i]) {
        //                trace("Gracfully Removing " + t + ":" + i);
        //                this._on_device_disconnect(i, t);
        //            }
        //        };
        //
        //        this.HostapdInstances[i].on("exit", drop_hostapd);
        //        this.HostapdInstances[i].on("stop", drop_hostapd);
        //
        //        Core.SubSys.Native.iw.Attach(this.HostapdInstances[i].Dev);
        //        this._mac_list[i] = {};
        //        this.HostapdInstances[i].Ctrl.on("event", (type, mac:string) => {
        //            if (type == "AP-STA-CONNECTED") {
        //                this._on_device_connect(i, mac);
        //            } else if (type == "AP-STA-DISCONNECTED") {
        //                this._on_device_disconnect(i, mac);
        //            }
        //        });
        //    })(i);
        //}
        cb();
    };

    _stop = (cb) => {
        //for (var i in this.HostapdInstances) {
        //    Core.SubSys.Native.iw.Detach(this.HostapdInstances[i].Dev);
        //    this.HostapdInstances[i].Ctrl.removeAllListeners("event");
        //}
        cb();
    };
}

export function Subscribe(cb) {
    var _wifiBus = new Wifi();

    var subNetwork = StatMgr.Sub(SECTION.NETWORK);
    subNetwork.devices.on('set', (mac, oldValue, leaseChanged) => {

    });
    subNetwork.devices.on('del', (mac) => {

    });

    var subTraffic = StatMgr.Sub(SECTION.TRAFFIC);
    subTraffic.on('traffics', (oldValue, traffics) => {

    });

    var subWlan2G4 = StatMgr.Sub(SECTION.WLAN2G);
    subWlan2G4.devices.on('set', (mac, oldValue, online)=> {
        online ? _wifiBus._on_device_connect(mac) : _wifiBus._on_device_disconnect(mac);
    });
    var subWlan5G7 = StatMgr.Sub(SECTION.WLAN5G);
    subWlan5G7.devices.on('set', (mac, oldValue, online)=> {
        online ? _wifiBus._on_device_connect(mac) : _wifiBus._on_device_disconnect(mac);
    });

    cb();
}


