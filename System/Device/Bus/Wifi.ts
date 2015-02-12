﻿import Node = require("Node");
import Core = require("Core");
import Bus = require("./Bus");

//TODO: MAKE 2.4G_5G A single Bus!!!

class Wifi extends Bus {

    constructor(public HostapdInstances : IDic<Core.SubSys.Native.hostapd.hostapd>) {
        super();
    }

    name = (): string => {
        return "WLAN";
    };

    _mac_list = {};

    _on_device_connect = (band, mac) => {
        mac = mac.toLowerCase();
        if (this._mac_list[band][mac]) {
            warn(mac + " skipped (resuming problem?)");
            return;
        }
        this._mac_list[band][mac] = 1;
        Core.SubSys.Native.ip.Neigh.WatchWithDev(this.HostapdInstances[band]._dev, mac, (addr) => {
            this._on_device({
                hwaddr: mac,
                data: {
                    Addr: addr
                }
            });
        });
        Core.Connectivity.LocalNetwork.DNSMASQ.Leases.Watch(mac, (lease) => {
            this._on_device({
                hwaddr: mac,
                data: {
                    Lease: lease
                }
            });
        });

        //rOUIFind((mac + "").substr(0, 8), (err, OUI: string) => {

        //    UARecon.WatchUA(mac, (ua, raw) => {
        //        Bus._onDevice(mac, {
        //            UA: { Obj: ua, raw: raw }
        //        });
        //        UAExtractor.Analyse(mac, raw, OUI, Bus.RawDevices[mac].properties["Extract"], (err, result) => {
        //            Bus._onDevice(mac, {
        //                Extract: result
        //            });
        //        });
        //    });

        //avoid clash
        setTask("IW_ImmediateSurvey", () => {
            Core.SubSys.Native.iw.ImmediateSurvey(() => {
                //log(JSON.stringify(Joint.Scaffold.IW.Station.Devices));
                info("Force Station Survey Completed");
            });
        }, 3000); //Magic..
        this._on_device({
            hwaddr: mac,
            data: {
                Band: band,
                Addr: Core.SubSys.Native.ip.Neigh.Get(mac),
                Lease: Core.Connectivity.LocalNetwork.DNSMASQ.Leases.LeaseDB[mac]
            }//OUI: OUI,
        });
        //});
    };

    _on_device_disconnect = (band, mac) => {
        mac = mac.toLowerCase();
        this._on_drop({
            hwaddr: mac
        });
        Core.SubSys.Native.ip.Neigh.Unwatch(mac);
        Core.Connectivity.LocalNetwork.DNSMASQ.Leases.Unwatch(mac);
        //UARecon.UnwatchUA(mac);
        this._mac_list[band][mac] = undefined;
    };


    start = (cb) => {
        this._mac_list = {};
        for (var i in this.HostapdInstances) {
            if (!has(this.HostapdInstances, i)) continue;
            ((i) => {
                this._mac_list[i] = {};
                this.HostapdInstances[i].Ctrl.on("event", (type, mac: string) => {
                    if (type == "AP-STA-CONNECTED") {
                        this._on_device_connect(i, mac);
                    } else if (type == "AP-STA-DISCONNECTED") {
                        this._on_device_disconnect(i, mac);
                    }
                });
            })(i);
        }
        cb();
    };

    stop = (cb) => {
        for (var i in this.HostapdInstances) {
            this.HostapdInstances[i].Ctrl.removeAllListeners("event");
        }
        cb();
    };
}

export = Wifi;