﻿import Node = require("Node");
import Core = require("Core");
import Native = Core.SubSys.Native;
import Abstract = Core.Lib.Abstract;
import Iptables = Native.iptables;
import Dnsmasq = Native.dnsmasq;

export var dnsmasq = new Dnsmasq.dnsmasq();

export var Config = new Configuration();
/*
    Filter-in ----> [system-in-filter] -----> [custom-in-filter] -----> 
 */

export var Chains =  {
    System: {
        Filter: {
            Input: new Iptables.Chain('in_sys', Iptables.Iptables.Filter),
            Forward: new Iptables.Chain('fw_sys', Iptables.Iptables.Filter),
            Output: new Iptables.Chain('ot_sys', Iptables.Iptables.Filter),
            TrafficAccounting: new Iptables.Chain("fw_traffic", Iptables.Iptables.Filter)
        },
        NAT: {
            Prerouting: new Iptables.Chain('pre_sys', Iptables.Iptables.NAT),
            Postrouting: new Iptables.Chain('post_sys', Iptables.Iptables.NAT)
        }
    },
    Custom: {
        Filter: {
            Input: new Iptables.Chain('in_custom', Iptables.Iptables.Filter),
            Forward: new Iptables.Chain('fw_custom', Iptables.Iptables.Filter),
            Output: new Iptables.Chain('ot_custom', Iptables.Iptables.Filter),
        }
    }
};

export var Rules =  {
    DropIncomingRequests: new Iptables.Rule(),
    HttpTrafficProxy: new Iptables.Rule(),
    UplinkNAT: new Iptables.Rule()
};

function InitNetwork(cb) {

    var s_account = new Iptables.Rule();
    s_account.Target = Iptables.Target_Type.CHAIN;
    s_account.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.TrafficAccounting.Name };

    var s_filter_in = new Iptables.Rule();
    s_filter_in.Target = Iptables.Target_Type.CHAIN;
    s_filter_in.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Input.Name };

    var s_filter_fw = new Iptables.Rule();
    s_filter_in.Target = Iptables.Target_Type.CHAIN;
    s_filter_in.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Forward.Name };

    var s_filter_ot = new Iptables.Rule();
    s_filter_in.Target = Iptables.Target_Type.CHAIN;
    s_filter_in.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Output.Name };


    var c_filter_in = new Iptables.Rule();
    c_filter_in.Target = Iptables.Target_Type.CHAIN;
    c_filter_in.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Input.Name };

    var c_filter_fw = new Iptables.Rule();
    c_filter_in.Target = Iptables.Target_Type.CHAIN;
    c_filter_in.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Forward.Name };

    var c_filter_ot = new Iptables.Rule();
    c_filter_in.Target = Iptables.Target_Type.CHAIN;
    c_filter_in.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Output.Name };

    var s_nat_pre = new Iptables.Rule();
    s_nat_pre.Target = Iptables.Target_Type.CHAIN;
    s_nat_pre.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.NAT.Prerouting.Name };

    var s_nat_post = new Iptables.Rule();
    s_nat_post.Target = Iptables.Target_Type.CHAIN;
    s_nat_post.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.NAT.Postrouting.Name };


    Rules.DropIncomingRequests.Match_State = <Iptables.IState> {
        NEW: true
    };
    Rules.DropIncomingRequests.Target = Iptables.Target_Type.DROP;

    Rules.HttpTrafficProxy.Protocol = { TCP: true };
    Rules.HttpTrafficProxy.Destination_Port = { Id: 80 };
    Rules.HttpTrafficProxy.Target = Iptables.Target_Type.REDIRECT;
    Rules.HttpTrafficProxy.TargetOptions = <Iptables.IRedirectOption>{
        Port: {
            Id: 3378
        }
    };

    Rules.UplinkNAT.Target = Iptables.Target_Type.MASQUERADE;

    async.series([
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/ip_forward"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv6/conf/default/forwarding"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv6/conf/all/forwarding"),

        Iptables.Iptables.Filter.AddChain.bind(null, Chains.System.Filter.TrafficAccounting),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.System.Filter.Input),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.System.Filter.Forward),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.System.Filter.Output),

        Iptables.Iptables.Filter.AddChain.bind(null, Chains.Custom.Filter.Input),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.Custom.Filter.Forward),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.Custom.Filter.Output),

        Iptables.Iptables.NAT.AddChain.bind(null, Chains.System.NAT.Prerouting),
        Iptables.Iptables.NAT.AddChain.bind(null, Chains.System.NAT.Postrouting),

        Iptables.Iptables.Filter.INPUT.Add.bind(null, s_filter_in),
        Iptables.Iptables.Filter.INPUT.Add.bind(null, c_filter_in),
        Iptables.Iptables.Filter.INPUT.Add.bind(null, Rules.DropIncomingRequests),
        Iptables.Iptables.Filter.FORWARD.Add.bind(null, s_account),
        Iptables.Iptables.Filter.FORWARD.Add.bind(null, s_filter_fw),
        Iptables.Iptables.Filter.FORWARD.Add.bind(null, c_filter_fw),
        Iptables.Iptables.Filter.OUTPUT.Add.bind(null, s_filter_ot),
        Iptables.Iptables.Filter.OUTPUT.Add.bind(null, c_filter_ot),

        Iptables.Iptables.NAT.PREROUTING.Add.bind(null, Rules.DropIncomingRequests),
        Iptables.Iptables.NAT.PREROUTING.Add.bind(null, s_nat_pre),
        Iptables.Iptables.NAT.POSTROUTING.Add.bind(null, s_nat_post),
        Iptables.Iptables.NAT.POSTROUTING.Add.bind(null, Rules.UplinkNAT)
    ], cb);

}

function InitTrafficAccounting(cb) {
    
}

export function Initialize(cb) {
    async.series([
        InitNetwork,
        Config.Initialize
    ], cb);
}



export function ResolveSubnetMacFromIp(ipaddr, cb: PCallback<[string, string]>) {
    for (var lease in dnsmasq.Leases.LeaseDB) {
        if (dnsmasq.Leases.LeaseDB[lease].Address == ipaddr) {
            return cb(undefined, [lease, dnsmasq.Leases.LeaseDB[lease].Interface]);
        }
    }
    var ipfromneigh = Native.ip.Neigh.GetByAddress_First(ipaddr);
    if (ipfromneigh) {
        return cb(undefined, [ipfromneigh.Mac, ipfromneigh.Dev]);
    }
    else {
        Native.ip.Neigh.GetByAddress_First_ActiveProbe(ipaddr,(err, result) => {
            if (!err && result) {
                return cb(undefined, [result.Mac, result.Dev]);
            } else {
                return cb(err, undefined);
            }
        });
    }
}

export function SetCustomHost(lst, cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage) {
        dnsmasq.Hosts[1] = lst;
    }
    else {
        curPackage.RegisterDeathHook("CUSTOMHOST",(pkg) => {
            _clearCustomHost(pkg.App.uid);
        });
        dnsmasq.Hosts[curPackage.App.uid] = lst;
    }
    dnsmasq.SIGHUP_Update(cb);
}

export function GetCustomHost(cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (curPackage) {
        cb(undefined,
            dnsmasq.Hosts[curPackage.App.uid]);
    } else {
        cb(undefined, dnsmasq.Hosts[1]);
    }
}

export function ClearCustomHost(cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage) {
        _clearCustomHost(1);
    } else {
        _clearCustomHost(curPackage.App.uid);
    }
    cb();
}

function _clearCustomHost(id) {
    dnsmasq.Hosts[id] = {};
}

export function SetCustomDNS(lst, cb) {
    if (!Array.isArray(lst)) {
        return cb(new Error("Not an Array"));
    }
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage) {
        dnsmasq.DNSRules[1] = lst;
    }
    else {
        curPackage.RegisterDeathHook("CUSTOMDNS",(pkg) => {
            _clearCustomDNS(pkg.App.uid);
        });
        dnsmasq.DNSRules[curPackage.App.uid] = lst;
    }
    dnsmasq.SIGHUP_Update(cb);
}

export function GetCustomDNS(cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (curPackage) {
        cb(undefined,
            dnsmasq.DNSRules[curPackage.App.uid]);
    } else {
        cb(undefined,
            dnsmasq.DNSRules[1]);
    }
}

export function ClearCustomDNS(cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage) {
        _clearCustomDNS(1);
    } else {
        _clearCustomDNS(curPackage.App.uid);
    }
    cb();
}

function _clearCustomDNS(id) {
    dnsmasq.DNSRules[id] = [];
}

class Configuration extends Abstract.Configurable {

    Default = {
        NetworkName: "E.D.G.E_dev",
        RouterIP: "192.168.100.1",
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

    constructor() {
        super();
    }

    protected _apply = (mod, raw, cb: Callback) => {
        if (!raw || Object.keys(raw).length == 0) {
            return cb(); //nothing changed
        }
        var jobs = [];
        var dhcp_reboot = false;
        var dhcp_hotplug = false;
        var addr_change = false;

        var addr = {
            Address: this.Get().RouterIP,
            Prefix: this.Get().LocalNetmask
        };

        if (has(mod, "NetworkName")) {
            if (Core.Router.Phy.Wifi.WLAN_2G4 && Core.Router.Phy.Wifi.Config.Get()._2G4 && Core.Router.Phy.Wifi.Config.Get()._2G4.AutoSSID) {
                Core.Router.Phy.Wifi.WLAN_2G4.Config.SSID = mod.NetworkName;
                Core.Router.Phy.Wifi.WLAN_2G4.Start(true);
                jobs.push(Core.Router.Phy.Wifi.WLAN_2G4.StabilityCheck);
            }
            if (Core.Router.Phy.Wifi.WLAN_5G7 && Core.Router.Phy.Wifi.Config.Get()._5G7 && Core.Router.Phy.Wifi.Config.Get()._5G7.AutoSSID) {
                Core.Router.Phy.Wifi.WLAN_5G7.Config.SSID = mod.NetworkName + "_5G";
                Core.Router.Phy.Wifi.WLAN_5G7.Start(true);
                jobs.push(Core.Router.Phy.Wifi.WLAN_5G7.StabilityCheck);
            }
        }
        if (has(mod, "RouterIP")) {
            dhcp_reboot = true;
            addr_change = true;
            dnsmasq.Config.Listen_Address = mod.RouterIP;
            dnsmasq.Hosts[0]["wi.fi"] = mod.RouterIP;
            dnsmasq.Hosts[0]["wifi.network"] = mod.RouterIP;
            dnsmasq.Hosts[0]["ed.ge"] = mod.RouterIP;
            addr["Address"] = mod.RouterIP;
        }
        if (has(mod, "LocalNetmask")) {
            dhcp_reboot = true;
            dnsmasq.Config.DHCPRange = {
                Begin: ip.cidr_num(dnsmasq.Config.Listen_Address, mod.LocalNetmask).replace(/\.0/g, ".10"),
                End: ip.cidr_num(dnsmasq.Config.Listen_Address, mod.LocalNetmask).replace(/\.0/g, ".230")
            };
            addr["Prefix"] = mod.LocalNetmask;
            addr_change = true;
        }
        if (has(mod, "Uplink")) {
            Rules.UplinkNAT.Iface_Out = { Prefix: mod.Uplink, Id: <any>"" };
            jobs.push(Rules.UplinkNAT.Save);
        }
        if (has(raw, "DNS")) {
            dhcp_hotplug = true;
            dnsmasq.DNSRules[0] = raw.DNS;
        }
        if (has(raw, "DHCPHosts")) {
            dhcp_hotplug = true;
            dnsmasq.DHCP_Hosts[0] = raw.DHCPHosts;
        }
        if (addr_change) {
            Rules.HttpTrafficProxy.Destination = {
                Addr: addr.Address,
                Prefix: addr.Prefix,
                Negate: true
            };
            Rules.DropIncomingRequests.Iface_In = {
                Prefix: CONF.DEV.ETH.DEV_WAN,
                Id: <any>""
            };
            Rules.UplinkNAT.Source = {
                Addr: addr.Address,
                Prefix: addr.Prefix
            };
            jobs.push(Native.ip.Addr.Set_Flush.bind(null, CONF.DEV.WLAN.DEV_2G, addr));
            //jobs.push(Native.ip.Addr.Set_Flush.bind(null, CONF.DEV.WLAN.DEV_5G, addr));
            jobs.push(Rules.DropIncomingRequests.Save);
            jobs.push(Rules.HttpTrafficProxy.Save);
            jobs.push(Rules.UplinkNAT.Save);
        }
        if (dhcp_reboot) {
            dnsmasq.Start(true);
            jobs.push(dnsmasq.StabilityCheck);
        } else if (dhcp_hotplug) {
            jobs.push(dnsmasq.SIGHUP_Update);
            jobs.push(dnsmasq.StabilityCheck);
        }
        if (jobs.length == 0) {
            cb(); //success!
        } else {
            async.parallel(jobs, cb);
        }
    };

    public Initialize = (cb) => {
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "LOCALNETWORK");
        this.Reload(this.Default, cb)
    };

}

export function GetDeviceByIp(_ip, cb) {
    var conn = Config.Get();
    var routerip = conn.RouterIP;
    var netmask = conn.LocalNetmask;
    var subnet = ip.cidr_num(_ip, netmask);
    var oursub = ip.cidr_num(routerip, netmask);
    if (oursub != subnet) {
        //unhappy :(
        cb(new Error("Outside current subnet"));
    } else {
        Core.Router.Network.ResolveSubnetMacFromIp(_ip,(err, mac_dev) => {
            if (err || !mac_dev) {
                return cb(err, undefined); //Not a part of our network :(
            } else {
                var hwaddr = mac_dev[0];
                var input_dev = mac_dev[1].toLowerCase();
                var dev = undefined;
                switch (input_dev) {
                    case CONF.DEV.WLAN.DEV_2G:
                        dev = Core.Device.DeviceManager.FromBus(hwaddr, CONF.BUS[CONF.DEV.WLAN.DEV_2G]);
                        break;
                    case CONF.DEV.WLAN.DEV_5G:
                        dev = Core.Device.DeviceManager.FromBus(hwaddr, CONF.BUS[CONF.DEV.WLAN.DEV_5G]);
                        break;
                }
                return cb(undefined, dev ? dev.id : undefined);
            }
        });
    }
}

export function Status(cb) {

}

__API(GetDeviceByIp, "Network.GetDeviceByIp", [Permission.DeviceAccess, Permission.Network, Permission.Configuration]);
__API(SetCustomDNS, "Network.DNS.Set", [Permission.Network, Permission.Configuration]);
__API(ClearCustomDNS, "Network.DNS.Clear", [Permission.Network, Permission.Configuration]);
__API(GetCustomDNS, "Network.DNS.Get", [Permission.Network, Permission.Configuration]);
__API(SetCustomHost, "Network.Hosts.Set", [Permission.Network, Permission.Configuration]);
__API(ClearCustomHost, "Network.Hosts.Clear", [Permission.Network, Permission.Configuration]);
__API(GetCustomHost, "Network.Hosts.Get", [Permission.Network, Permission.Configuration]);
__API(Config.Get, "Network.Config.Get", [Permission.Network, Permission.Configuration]);
__API(Config.Apply, "Network.Config.Apply", [Permission.Network, Permission.Configuration]);
__API(Status, "Network.Status", [Permission.Network, Permission.Configuration]);