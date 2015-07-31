eval(LOG("Router:Network:Network"));

import iproute2 = require('../../Common/Native/iproute2');
import ssdp = require('../../Common/Native/ssdp');
import mdns = require('../../Common/Native/mdns');
import NeighRecord = iproute2.NeighRecord;
import LinkInterface = iproute2.LinkInterface;
import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import Dnsmasq = require('../../Common/Native/dnsmasq');
import _uDhcpC = require('../../Common/Native/udhcpc');
import UDhcpC = _uDhcpC.UDhcpC;
import AppConfig = require('../../APP/Resource/AppConfig');
import P0F = require('../../Common/Native/p0f');
import _PPPD = require('../../Common/Native/pppd');
import PPPoEDaemon = _PPPD.PPPoEDaemon;
import StatBiz = require('../../Common/Stat/StatBiz');

var dnsmasq = new Dnsmasq.dnsmasq();

var ssdpDirectories:ssdp.SimpleUPNPRecord[] = [{}];
var ssdpServices = [];

var pub = StatMgr.Pub(SECTION.NETWORK, {
    leases: {},
    arp: {},
    network: {},
    mdns: {},
    ssdp: {},
    p0f: {},
    link: {},
    addr: {}
});

class Configuration extends Configurable {

    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);
    }

    _apply = (delta, original, cb) => {
        var jobs = [];
        var dhcp_reboot = false;
        var dhcp_hotplug = false;
        var addr_change = false;
        var addr = {
            Address: this.ConfigHandler.Get().RouterIP,
            Prefix: this.ConfigHandler.Get().LocalNetmask
        };
        var network:any = {};

        if (has(delta, "NetworkName")) {
            network.NetworkName = delta.NetworkName;
        }
        if (has(delta, "RouterIP")) {
            //ifconfig br0 ip
            exec("ifconfig", CONF.DEV.WLAN.WLAN_BR, delta.RouterIP/* + "/" + addr.Prefix*/);

            network.RouterIP = delta.RouterIP;
            dhcp_reboot = true;
            addr_change = true;
            dnsmasq.Config.Listen_Address = delta.RouterIP;
            dnsmasq.Hosts[0]["wi.fi"] = delta.RouterIP;
            dnsmasq.Hosts[0]["wifi.network"] = delta.RouterIP;
            dnsmasq.Hosts[0]["ed.ge"] = delta.RouterIP;
            dnsmasq.Hosts[0]["wifi"] = delta.RouterIP;
            dnsmasq.Config.Addresss[".wi.fi"] = delta.RouterIP;
            dnsmasq.Config.Addresss[".wifi.network"] = delta.RouterIP;
            dnsmasq.Config.Addresss[".ed.ge"] = delta.RouterIP;
            dnsmasq.Config.Addresss[".wifi"] = delta.RouterIP;
            addr["Address"] = delta.RouterIP;

            //SSDP
            while (ssdpServices.length) {
                ssdpServices.pop().Stop();
            }
            for (var i = 0; i < ssdpDirectories.length; i++) {
                var s = new ssdp.SSDP_Server(ssdpDirectories[i], delta.RouterIP);
                ssdpServices.push(s);
                s.Start();
            }
            //TODO: mdns configuration (for MAC

        }
        if (has(delta, "LocalNetmask")) {
            network.LocalNetmask = delta.LocalNetmask;

            dhcp_reboot = true;
            dnsmasq.Config.DHCPRange = {
                Begin: ip.cidr_num(dnsmasq.Config.Listen_Address, delta.LocalNetmask).replace(/\.0/g, ".10"),
                End: ip.cidr_num(dnsmasq.Config.Listen_Address, delta.LocalNetmask).replace(/\.0/g, ".230")
            };
            addr["Prefix"] = delta.LocalNetmask;
            addr_change = true;
        }
        if (has(delta, "Uplink")) {
            network.Uplink = delta.Uplink;
            network.DropIncomingRequests = { //Rules.DropIncomingRequests.Iface_In
                Interface: delta.Uplink
            };
        }
        if (has(delta, "DNS")) {
            dhcp_hotplug = true;
            dnsmasq.DNSRules[0] = delta.DNS;
        }
        if (has(delta, "DHCPHosts")) {
            dhcp_hotplug = true;
            dnsmasq.DHCP_Hosts[0] = delta.DHCPHosts;
        }

        //APP  [moduleName]['APP'][appUid]
        if (has(delta, 'APP')) {
            for (var appUid in delta.APP) {
                var appConfig = delta.APP[appUid];
                if (has(appConfig, 'Hosts')) {
                    dnsmasq.Hosts[1][appUid] = appConfig.Hosts || [];

                    dhcp_hotplug = true;
                }
            }
        }

        if (addr_change) {
            network.NetworkAddress = addr["Address"] + '/' + addr["Prefix"];
        }
        if (dhcp_reboot) {
            //console.log('^______________^ dhcp_reboot');
            dnsmasq.Start(true);
            jobs.push(dnsmasq.StabilityCheck);
        } else if (dhcp_hotplug) {
            //console.log('^______________^ dhcp_hotplug');
            jobs.push(dnsmasq.ApplyChange);
            jobs.push(dnsmasq.StabilityCheck);
        }

        if (Object.keys(network).length) {
            pub.network.Set('config', network);
        }

        //console.log('^______________^ jobs', jobs.length);

        if (jobs.length == 0) {
            cb(); //success!
        } else {
            intoQueue('DNSMASQ_dhcphotplug', (queue_cb) => {
                async.series(jobs, ()=> {
                    queue_cb();
                });
            }, cb);
        }
    }

    _recycle = (appUid, cb) => {
        //console.log('-----------Network _recycle received.');
        if (dnsmasq.Hosts[1][appUid]) {
            console.log('^______________^ APP _revoke Shut', appUid, dnsmasq.Hosts);
            dnsmasq.Hosts[1][appUid] = undefined;
            delete dnsmasq.Hosts[1][appUid];
            var jobs = [];
            jobs.push(dnsmasq.ApplyChange);
            jobs.push(dnsmasq.StabilityCheck);
            async.series(jobs, cb);
        } else {
            cb();
        }
    }
}

var defaultConfig = {
    NetworkName: "edge-1",
    RouterIP: "192.168.66.1",
    LocalNetmask: 24,
    Uplink: CONF.DEV.ETH.DEV_WAN, //ethernet
    DNS: [
        {
            UpStreamDNS: "114.114.114.114" //UpStreamPort: string; //Domains?: string[];
        },
        {
            UpStreamDNS: "8.8.8.8" //UpStreamPort: string; //Domains?: string[];
        }
    ],
    DHCPHosts: {},
    WAN: {
        Scheme: WANScheme.UDHCPC,
        PPPDOptions: { //supply for PPPD
            PPPD_ACCOUNT: "",
            PPPD_PASSWD: "",
            PPPD_NUMBER: 0
        }
    }
};

export function Initialize(cb) {
    var confNetwork = new Configuration(SECTION.NETWORK, defaultConfig);

    async.series([
        (cb)=> {
            var conf = confNetwork.Get();
            if (!conf.WAN) {
                warn('Missing WAN Scheme configruation.', conf);
            }
            if (conf.WAN && conf.WAN.Scheme === WANScheme.PPPD && conf.WAN.PPPDOptions) {
                var options = conf.WAN.PPPDOptions;
                var pppd = new PPPoEDaemon(options.PPPD_ACCOUNT, options.PPPD_PASSWD, options.PPPD_NUMBER);
                pppd.Start(true);
                pppd.StabilityCheck((err)=> {
                    if (err) error(err);
                    cb();
                });
            } else if (conf.WAN.Scheme === WANScheme.UDHCPC) {
                var udhcpc = new UDhcpC();
                udhcpc.Start(true);
                cb();
            }
        },
        (cb)=> {
            iproute2.Initialize(()=> {
                iproute2.Neigh.on(iproute2.Neigh.EVENT_RECORD_NEW, (neighRecord:NeighRecord) => {
                    pub.arp.Set(neighRecord.Mac, neighRecord);
                });

                iproute2.Neigh.on(iproute2.Neigh.EVENT_RECORD_CHANGE, (neighRecord:NeighRecord) => {
                    pub.arp.Set(neighRecord.Mac, neighRecord);
                });

                iproute2.Neigh.on(iproute2.Neigh.EVENT_RECORD_DEL, (neighRecord:NeighRecord) => {
                    pub.arp.Del(neighRecord.Mac);
                });

                iproute2.Link.on(iproute2.Link.EVENT_RECORD_NEW, (dev, link:LinkInterface)=>{
                    pub.link.Set(dev, link);
                });

                iproute2.Link.on(iproute2.Link.EVENT_RECORD_CHANGE, (dev, link:LinkInterface)=>{
                    pub.link.Set(dev, link);
                });

                iproute2.Link.on(iproute2.Link.EVENT_RECORD_DEL, (dev, link:LinkInterface)=>{
                    pub.link.Del(dev);
                });

                iproute2.Addr.on(iproute2.Addr.EVENT_RECORD_NEW, (id, index)=>{
                    pub.addr.Set(id, iproute2.Addr.Interfaces[id]);
                });

                iproute2.Addr.on(iproute2.Addr.EVENT_RECORD_DEL, (id, index) => {
                    pub.addr.Set(id, iproute2.Addr.Interfaces[id]);
                });


                iproute2.Link.Load(()=>{
                    //TODO: Check for records that might be 'missed out' upon boot
                    for(var i in iproute2.Link.Interfaces){
                        pub.link.Set(i, iproute2.Link.Interfaces[i]);
                    }
                });
                iproute2.Neigh.Load(()=>{
                    for(var i in iproute2.Neigh.MacList){
                        pub.arp.Set(i, iproute2.Neigh.MacList[i]);
                    }
                });
                iproute2.Addr.Load(()=>{
                    for(var i in iproute2.Addr.Interfaces){
                        pub.addr.Set(i, iproute2.Addr.Interfaces[i]);
                    }
                });

                cb();
            });
        },
        (cb)=> {
            ssdp.Initialize(cb);
        },
        (cb)=> {
            P0F.Initialize(cb);
        },
        (cb)=> {
            confNetwork.Initialize(cb);
        }
    ], ()=> {
        cb();
    });

    dnsmasq.Leases.on(Dnsmasq.DHCPLeaseManager.EVENT_ADD, (lease:Dnsmasq.IDHCPLease)=> { // DEVICE ADDED
        pub.leases.Set(lease.Mac, lease);
        console.log('Dnsmasq Add Lease'['greenBG'].bold, lease);
        var mdnsStatus = StatBiz.GetMDNSByIP(lease.Address);
        if (!mdnsStatus)
            pub.mdns.Set(lease.Address, {});
    });

    dnsmasq.Leases.on(Dnsmasq.DHCPLeaseManager.EVENT_CHANGE, (lease:Dnsmasq.IDHCPLease)=> { // DEVICE CHANGED
        pub.leases.Set(lease.Mac, lease);
        console.log('Dnsmasq Add Change'['greenBG'].bold, lease);
        var mdnsStatus = StatBiz.GetMDNSByIP(lease.Address);
        if (!mdnsStatus)
            pub.mdns.Set(lease.Address, {});
    });

    dnsmasq.Leases.on(Dnsmasq.DHCPLeaseManager.EVENT_DEL, (lease:Dnsmasq.IDHCPLease)=> { // DEVICE DELETED
        warn('EVENT_DEL', lease);
        pub.leases.Del(lease.Mac);
        pub.mdns.Del(lease.Address);
    });

    ssdp.SSDP_Browser.on(ssdp.SSDP_Browser.EVENT_SERVICE_UP, (IP, headers)=> {
        //console.log('ssdp device up', IP, headers);
        pub.ssdp.Set(IP, headers);
    });
    ssdp.SSDP_Browser.on(ssdp.SSDP_Browser.EVENT_SERVICE_DOWN, (IP, headers)=> {
        //console.log('ssdp device down', IP, headers);
        //pub.ssdp.Del(IP);
    });

    mdns.Emitter.on("serviceUp", (IP, service)=> {
        var mdnsStatus = StatBiz.GetMDNSByIP(IP)
        if (mdnsStatus) {
            pub.mdns[IP].Set(service.type.name, {type: 'UP', service: service});
        }
    });
    // mdns.Browser.on(mdns.Browser.EVENT_SERVICE_DOWN, (IP, service)=> {
    //     var mdnsStatus = StatBiz.GetMDNSByIP(IP)
    //     if (mdnsStatus) {
    //         pub.mdns[IP].Set(service.type.name, {type: 'DOWN', service: service});
    //     }
    // });

    P0F.P0FInstance.on(P0F.P0FInstance.EVENT_DEVICE, (IP, description)=> {
        pub.p0f.Set(IP, description);
    });
}

export function Diagnose(callback:Callback) {
    setTask('stability_check_dnsmasq', ()=> {
        dnsmasq.StabilityCheck((err, stable)=> {
            if (err) return callback(err);
            return callback(null, stable);
        });
    }, 2000);
}

function CheckNameAvailability(name, cb) {
    dnsmasq.CheckNameAvailability(name, cb);
}

function SetDNSHostname(hostnames, cb) {
    var appUid = SenderId(this);
    //fatal('---------------------------0000000 ', appUid, hostnames);
    AppConfig.Set(SECTION.NETWORK, appUid, {Hosts: hostnames}, cb);
}

__API(CheckNameAvailability, 'Network.CheckNameAvailability', [Permission.Network]);
__API(SetDNSHostname, 'Network.SetDNSHostname', [Permission.Network]);


SYS_ON(SYS_EVENT_TYPE.LOADED, function(){
    mdns.Initialize(()=>{});
});
