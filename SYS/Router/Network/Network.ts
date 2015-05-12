import iproute2 = require('../../Common/Native/iproute2');
import ssdp = require('../../Common/Native/ssdp');
import mdns = require('../../Common/Native/mdns_');
import NeighRecord = iproute2.NeighRecord;
import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import _StatNode = require('../../Common/Stat/StatNode');
import StatNode = _StatNode.StatNode;
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import Dnsmasq = require('../../Common/Native/dnsmasq');

var dnsmasq = new Dnsmasq.dnsmasq();

var ssdpDirectories: ssdp.SimpleUPNPRecord[] = [{}];
var ssdpServices = [];

var pub = StatMgr.Pub(SECTION.NETWORK, {
    leases: {},
    arp: {},
    network: {},
    mdns: {},
    ssdp: {}
});

class Configuration extends Configurable {
    private pub:StatNode;

    constructor(moduleName:string, defaultConfig:any, pub:StatNode) {
        super(moduleName, defaultConfig);

        this.pub = pub;
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
            while(ssdpServices.length){
                ssdpServices.pop().Stop();
            }
            for(var i = 0; i < ssdpDirectories.length; i++){
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
        if (has(original, "DNS")) {
            dhcp_hotplug = true;
            dnsmasq.DNSRules[0] = original.DNS;
        }
        if (has(original, "DHCPHosts")) {
            dhcp_hotplug = true;
            dnsmasq.DHCP_Hosts[0] = original.DHCPHosts;
        }
        if (addr_change) {
            network.NetworkAddress = addr["Address"] + '/' + addr["Prefix"];
        }
        if (dhcp_reboot) {
            dnsmasq.Start(true);
            jobs.push(dnsmasq.StabilityCheck);
        } else if (dhcp_hotplug) {
            jobs.push(dnsmasq.ApplyChange);
            jobs.push(dnsmasq.StabilityCheck);
        }

        if (Object.keys(network).length) {
            this.pub.Set('network', network);
        }
        if (jobs.length == 0) {
            cb(); //success!
        } else {
            async.series(jobs, cb);
        }
    }
}

var defaultConfig = {
    NetworkName: "edge-dev",
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
    DHCPHosts: {}
};

export function Initialize(cb) {
    var confNetwork = new Configuration(SECTION.NETWORK, defaultConfig, pub);

    async.series([
        (cb)=> {
            iproute2.Initialize(()=>{
                iproute2.Neigh.on(iproute2.Neigh.EVENT_RECORD_NEW, (neighRecord:NeighRecord) => {
                    pub.arp.Set(neighRecord.Mac, neighRecord);
                });

                iproute2.Neigh.on(iproute2.Neigh.EVENT_RECORD_CHANGE, (neighRecord:NeighRecord) => {
                    pub.arp.Set(neighRecord.Mac, neighRecord);
                });

                iproute2.Neigh.on(iproute2.Neigh.EVENT_RECORD_DEL, (neighRecord:NeighRecord) => {
                    pub.arp.Del(neighRecord.Mac);
                });
                cb();
            });
        },
        (cb)=> {
            ssdp.Initialize(cb);
        },
        (cb)=> {
            mdns.Initialize(cb);
        },
        (cb)=> {
            confNetwork.Initialize(cb);
        }
    ], ()=>{
        cb();
    });

    dnsmasq.Leases.on(Dnsmasq.DHCPLeaseManager.EVENT_ADD, (lease:Dnsmasq.IDHCPLease)=> { // DEVICE ADDED
        warn('EVENT_ADD', lease);
        pub.leases.Set(lease.Mac, lease);
    });

    dnsmasq.Leases.on(Dnsmasq.DHCPLeaseManager.EVENT_CHANGE, (lease:Dnsmasq.IDHCPLease)=> { // DEVICE CHANGED
        warn('EVENT_CHANGE', lease);
        pub.leases.Set(lease.Mac, lease);
    });

    dnsmasq.Leases.on(Dnsmasq.DHCPLeaseManager.EVENT_DEL, (lease:Dnsmasq.IDHCPLease)=> { // DEVICE DELETED
        warn('EVENT_DEL', lease);
        pub.leases.Del(lease.Mac);
    });

    ssdp.SSDP_Browser.on(ssdp.SSDP_Browser.EVENT_SERVICE_UP, (IP, headers)=>{
        console.log('ssdp device up', IP, headers);
        pub.ssdp.Set(IP, headers);
    });
    ssdp.SSDP_Browser.on(ssdp.SSDP_Browser.EVENT_SERVICE_DOWN, (IP, headers)=>{
        console.log('ssdp device down', IP, headers);
        pub.ssdp.Del(IP);
    });

    mdns.Browser.on(mdns.Browser.EVENT_SERVICE_UP, (IP, service)=>{
        console.log('mdns device up', IP, service);
        pub.mdns.Set(IP, service);
    });
    mdns.Browser.on(mdns.Browser.EVENT_SERVICE_DOWN, (IP, service)=>{
        console.log('mdns device down', IP, service);
        pub.mdns.Del(IP);
    });
}


function CheckNameAvailability(name, cb) {
    dnsmasq.CheckNameAvailability(name, cb);
}

__API(CheckNameAvailability, 'Network.CheckNameAvailability', [Permission.Network]);