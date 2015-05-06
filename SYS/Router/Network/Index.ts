import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import _StatNode = require('../../Common/Stat/StatNode');
import StatNode = _StatNode.StatNode;
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import Dnsmasq = require('../../Common/Native/dnsmasq');
export var dnsmasq = new Dnsmasq.dnsmasq();

class Configuration extends Configurable {
    private emitter:StatNode;

    constructor(moduleName:string, defaultConfig:any, emitter:StatNode) {
        super(moduleName, defaultConfig);

        this.emitter = emitter;
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
        var stateChange:any = {};

        if (has(delta, "NetworkName")) {
            stateChange.NetworkName = delta.NetworkName;
        }
        if (has(delta, "RouterIP")) {
            //ifconfig br0 ip
            exec("ifconfig", CONF.DEV.WLAN.WLAN_BR, delta.RouterIP/* + "/" + addr.Prefix*/);

            stateChange.RouterIP = delta.RouterIP;
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
        }
        if (has(delta, "LocalNetmask")) {
            stateChange.LocalNetmask = delta.LocalNetmask;

            dhcp_reboot = true;
            dnsmasq.Config.DHCPRange = {
                Begin: ip.cidr_num(dnsmasq.Config.Listen_Address, delta.LocalNetmask).replace(/\.0/g, ".10"),
                End: ip.cidr_num(dnsmasq.Config.Listen_Address, delta.LocalNetmask).replace(/\.0/g, ".230")
            };
            addr["Prefix"] = delta.LocalNetmask;
            addr_change = true;
        }
        if (has(delta, "Uplink")) {
            stateChange.Uplink = delta.Uplink;
            stateChange.DropIncomingRequests = { //Rules.DropIncomingRequests.Iface_In
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
            stateChange.NetworkAddress = addr["Address"] + '/' + addr["Prefix"];
        }
        if (dhcp_reboot) {
            dnsmasq.Start(true);
            jobs.push(dnsmasq.StabilityCheck);
        } else if (dhcp_hotplug) {
            jobs.push(dnsmasq.ApplyChange);
            jobs.push(dnsmasq.StabilityCheck);
        }

        if (Object.keys(stateChange).length) {
            this.emitter.set('network', stateChange);
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
    var emitter = StatMgr.Pub(SECTION.NETWORK, {
        devices: {},
        network: {}
    });
    var confNetwork = new Configuration(SECTION.NETWORK, defaultConfig, emitter);
    confNetwork.Initialize(cb);

    dnsmasq.on(Dnsmasq.DHCPLeaseManager.EVENT_ADD, (lease:Dnsmasq.IDHCPLease)=>{ // DEVICE ADDED
        emitter.devices.set('DEVICE_ADDED', lease);
    });

    dnsmasq.on(Dnsmasq.DHCPLeaseManager.EVENT_CHANGE, (lease:Dnsmasq.IDHCPLease)=>{ // DEVICE CHANGED
        emitter.devices.set('DEVICE_CHANGED', lease);
    });

    dnsmasq.on(Dnsmasq.DHCPLeaseManager.EVENT_DEL, (lease:Dnsmasq.IDHCPLease)=>{ // DEVICE DELETED
        emitter.devices.set('DEVICE_DELETED', lease);
    });
}
