var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Core = require("Core");
var Bus = require("./Bus");
var Wifi = (function (_super) {
    __extends(Wifi, _super);
    function Wifi(HostapdInstances) {
        var _this = this;
        _super.call(this);
        this.HostapdInstances = HostapdInstances;
        this.name = function () {
            return "WLAN";
        };
        this._mac_list = {};
        this._on_device_connect = function (band, mac) {
            if (!mac)
                return warn(" Invalid MAC - Skipped ");
            mac = mac.toLowerCase();
            if (_this._mac_list[band][mac]) {
                warn(mac + " skipped (resuming problem?)");
                return;
            }
            _this._mac_list[band][mac] = 1;
            Core.SubSys.Native.ip.Neigh.WatchWithDev(_this.HostapdInstances[band]._dev, mac, function (addr) {
                _this._on_device({
                    hwaddr: mac,
                    data: {
                        Addr: addr
                    }
                });
            });
            var currentIp = Core.Router.Network.dnsmasq.Leases.LeaseDB[mac] ? Core.Router.Network.dnsmasq.Leases.LeaseDB[mac].Address : undefined;
            Core.Router.Network.dnsmasq.Leases.Watch(mac, function (lease) {
                if (currentIp) {
                    Core.SubSys.Native.mdns.Browser.Unwatch(currentIp);
                }
                currentIp = Core.Router.Network.dnsmasq.Leases.LeaseDB[mac] ? Core.Router.Network.dnsmasq.Leases.LeaseDB[mac].Address : undefined;
                Core.SubSys.Network.Traffic.Update(mac, currentIp, function () {
                });
                _this._on_device({
                    hwaddr: mac,
                    data: {
                        Lease: lease
                    }
                });
                if (currentIp) {
                    Core.SubSys.Native.mdns.Browser.Watch(currentIp, function (service, mine) {
                        _this._on_device({
                            hwaddr: mac,
                            data: {
                                MDNS: mine
                            }
                        });
                    }, function (service, mine) {
                        _this._on_device({
                            hwaddr: mac,
                            data: {
                                MDNS: mine
                            }
                        });
                    });
                    Core.SubSys.Native.ssdp.SSDP_Browser.Watch(currentIp, function (service, mine) {
                        _this._on_device({
                            hwaddr: mac,
                            data: {
                                SSDP: mine
                            }
                        });
                    }, function (service, mine) {
                        _this._on_device({
                            hwaddr: mac,
                            data: {
                                SSDP: mine
                            }
                        });
                    });
                }
            });
            Core.SubSys.Native.iw.Watch(mac, function (d) {
                _this._on_device({
                    hwaddr: mac,
                    data: {
                        Wireless: d
                    }
                });
            });
            Core.SubSys.Network.Traffic.NotifyOnTraffic(mac, function (mac, data) {
                _this._on_device({
                    hwaddr: mac,
                    data: {
                        Traffic: {
                            Down: data
                        }
                    }
                });
            }, function (mac, data) {
                _this._on_device({
                    hwaddr: mac,
                    data: {
                        Traffic: {
                            Up: data
                        }
                    }
                });
            });
            setTask("IW_ImmediateSurvey", function () {
                Core.SubSys.Native.iw.ImmediateSurvey(function () {
                    info("Force Station Survey Completed");
                });
            }, 3000);
            _this._on_device({
                hwaddr: mac,
                data: {
                    Band: band,
                    Addr: Core.SubSys.Native.ip.Neigh.Get(mac),
                    Lease: Core.Router.Network.dnsmasq.Leases.LeaseDB[mac],
                    Wireless: Core.SubSys.Native.iw.Devices[mac],
                    Traffic: {},
                    MDNS: {},
                    SSDP: {}
                }
            });
        };
        this._on_device_disconnect = function (band, mac) {
            mac = mac.toLowerCase();
            _this._on_drop({
                hwaddr: mac
            });
            Core.SubSys.Native.iw.Unwatch(mac);
            Core.SubSys.Native.ip.Neigh.Unwatch(mac);
            Core.Router.Network.dnsmasq.Leases.Unwatch(mac);
            Core.SubSys.Network.Traffic.RemoveHandler(mac);
            Core.SubSys.Network.Traffic.Unwatch(mac, function () {
            });
            var ip = Core.Router.Network.dnsmasq.Leases.LeaseDB[mac];
            ;
            if (ip) {
                Core.SubSys.Native.mdns.Browser.Unwatch(ip);
                Core.SubSys.Native.ssdp.SSDP_Browser.Unwatch(ip);
            }
            _this._mac_list[band][mac] = undefined;
        };
        this._start = function (cb) {
            _this._mac_list = {};
            for (var i in _this.HostapdInstances) {
                if (!has(_this.HostapdInstances, i))
                    continue;
                (function (i) {
                    var drop_hostapd = function () {
                        for (var t in _this._mac_list[i]) {
                            trace("Gracfully Removing " + t + ":" + i);
                            _this._on_device_disconnect(i, t);
                        }
                    };
                    _this.HostapdInstances[i].on("exit", drop_hostapd);
                    _this.HostapdInstances[i].on("stop", drop_hostapd);
                    Core.SubSys.Native.iw.Attach(_this.HostapdInstances[i].Dev);
                    _this._mac_list[i] = {};
                    _this.HostapdInstances[i].Ctrl.on("event", function (type, mac) {
                        if (type == "AP-STA-CONNECTED") {
                            _this._on_device_connect(i, mac);
                        }
                        else if (type == "AP-STA-DISCONNECTED") {
                            _this._on_device_disconnect(i, mac);
                        }
                    });
                })(i);
            }
            cb();
        };
        this._stop = function (cb) {
            for (var i in _this.HostapdInstances) {
                Core.SubSys.Native.iw.Detach(_this.HostapdInstances[i].Dev);
                _this.HostapdInstances[i].Ctrl.removeAllListeners("event");
            }
            cb();
        };
    }
    return Wifi;
})(Bus);
module.exports = Wifi;
