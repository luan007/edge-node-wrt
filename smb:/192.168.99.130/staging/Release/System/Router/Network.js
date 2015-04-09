var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Core = require("Core");
var Native = Core.SubSys.Native;
var Abstract = Core.Lib.Abstract;
var Iptables = Native.iptables;
var Dnsmasq = Native.dnsmasq;
exports.dnsmasq = new Dnsmasq.dnsmasq();
exports.Chains = {
    System: {
        Filter: {
            Input: new Iptables.Chain('in_sys', Iptables.Iptables.Filter),
            Forward: new Iptables.Chain('fw_sys', Iptables.Iptables.Filter),
            Output: new Iptables.Chain('ot_sys', Iptables.Iptables.Filter),
        },
        NAT: {
            Prerouting: new Iptables.Chain('pre_sys', Iptables.Iptables.NAT),
            Postrouting: new Iptables.Chain('post_sys', Iptables.Iptables.NAT)
        },
        Mangle: {
            TrafficPre: new Iptables.Chain("pre_traffic", Iptables.Iptables.Mangle),
            TrafficPost: new Iptables.Chain("post_traffic", Iptables.Iptables.Mangle)
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
exports.Rules = {
    DropIncomingRequests: new Iptables.Rule(),
    HttpTrafficProxy: new Iptables.Rule(),
    UplinkNAT: new Iptables.Rule()
};
function InitNetwork(cb) {
    var s_account_i = new Iptables.Rule();
    s_account_i.Target = 1001 /* CHAIN */;
    s_account_i.TargetOptions = { Chain: exports.Chains.System.Mangle.TrafficPre.Name };
    var s_account_o = new Iptables.Rule();
    s_account_o.Target = 1001 /* CHAIN */;
    s_account_o.TargetOptions = { Chain: exports.Chains.System.Mangle.TrafficPost.Name };
    var s_filter_in = new Iptables.Rule();
    s_filter_in.Target = 1001 /* CHAIN */;
    s_filter_in.TargetOptions = { Chain: exports.Chains.System.Filter.Input.Name };
    var s_filter_fw = new Iptables.Rule();
    s_filter_fw.Target = 1001 /* CHAIN */;
    s_filter_fw.TargetOptions = { Chain: exports.Chains.System.Filter.Forward.Name };
    var s_filter_ot = new Iptables.Rule();
    s_filter_ot.Target = 1001 /* CHAIN */;
    s_filter_ot.TargetOptions = { Chain: exports.Chains.System.Filter.Output.Name };
    var c_filter_in = new Iptables.Rule();
    c_filter_in.Target = 1001 /* CHAIN */;
    c_filter_in.TargetOptions = { Chain: exports.Chains.Custom.Filter.Input.Name };
    var c_filter_fw = new Iptables.Rule();
    c_filter_fw.Target = 1001 /* CHAIN */;
    c_filter_fw.TargetOptions = { Chain: exports.Chains.Custom.Filter.Forward.Name };
    var c_filter_ot = new Iptables.Rule();
    c_filter_ot.Target = 1001 /* CHAIN */;
    c_filter_ot.TargetOptions = { Chain: exports.Chains.Custom.Filter.Output.Name };
    var s_nat_pre = new Iptables.Rule();
    s_nat_pre.Target = 1001 /* CHAIN */;
    s_nat_pre.TargetOptions = { Chain: exports.Chains.System.NAT.Prerouting.Name };
    var s_nat_post = new Iptables.Rule();
    s_nat_post.Target = 1001 /* CHAIN */;
    s_nat_post.TargetOptions = { Chain: exports.Chains.System.NAT.Postrouting.Name };
    exports.Rules.DropIncomingRequests.Match_State = {
        NEW: true
    };
    exports.Rules.DropIncomingRequests.Target = (CONF.IS_DEBUG && !CONF.BASE_FIREWALL) ? 0 /* ACCEPT */ : 1 /* DROP */;
    if (CONF.ENABLE_HTTPPROXY) {
        exports.Rules.HttpTrafficProxy.Protocol = { TCP: true };
        exports.Rules.HttpTrafficProxy.Destination_Port = { Id: 80 };
        exports.Rules.HttpTrafficProxy.Target = 3 /* REDIRECT */;
        exports.Rules.HttpTrafficProxy.TargetOptions = {
            Port: {
                Id: 3378
            }
        };
    }
    else {
        exports.Rules.HttpTrafficProxy.Target = 1000 /* RETURN */;
    }
    exports.Rules.UplinkNAT.Target = 6 /* MASQUERADE */;
    async.series([
        function (c) {
            exec("iw ap0 del", function () {
                trace("DEL AP0");
                setTimeout(c, 1000);
            });
        },
        function (c) {
            exec("iw ap1 del", function () {
                trace("DEL AP0");
                setTimeout(c, 1000);
            });
        },
        function (c) {
            exec("iw phy phy0 interface add ap0 type __ap", function () {
                trace("AP0");
                setTimeout(c, 1000);
            });
        },
        function (c) {
            exec("iw phy phy1 interface add ap1 type __ap", function () {
                trace("AP1");
                setTimeout(c, 1000);
            });
        },
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/ip_forward"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv6/conf/default/forwarding"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv6/conf/all/forwarding"),
        exec.bind(null, "echo 8388608 > /proc/sys/net/core/rmem_max"),
        exec.bind(null, "echo 8388608 > /proc/sys/net/core/wmem_max"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/tcp_timestamps"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/tcp_fack"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/tcp_sack"),
        exec.bind(null, "echo '8192 4194304 8388608' > /proc/sys/net/ipv4/tcp_wmem"),
        exec.bind(null, "echo '4096 2097152 8388608' > /proc/sys/net/ipv4/tcp_rmem"),
        Iptables.Iptables.Mangle.AddChain.bind(null, exports.Chains.System.Mangle.TrafficPre),
        Iptables.Iptables.Mangle.AddChain.bind(null, exports.Chains.System.Mangle.TrafficPost),
        Iptables.Iptables.Filter.AddChain.bind(null, exports.Chains.System.Filter.Input),
        Iptables.Iptables.Filter.AddChain.bind(null, exports.Chains.System.Filter.Forward),
        Iptables.Iptables.Filter.AddChain.bind(null, exports.Chains.System.Filter.Output),
        Iptables.Iptables.Filter.AddChain.bind(null, exports.Chains.Custom.Filter.Input),
        Iptables.Iptables.Filter.AddChain.bind(null, exports.Chains.Custom.Filter.Forward),
        Iptables.Iptables.Filter.AddChain.bind(null, exports.Chains.Custom.Filter.Output),
        Iptables.Iptables.NAT.AddChain.bind(null, exports.Chains.System.NAT.Prerouting),
        Iptables.Iptables.NAT.AddChain.bind(null, exports.Chains.System.NAT.Postrouting),
        Iptables.Iptables.Filter.INPUT.Add.bind(null, s_filter_in),
        Iptables.Iptables.Filter.INPUT.Add.bind(null, c_filter_in),
        Iptables.Iptables.Filter.INPUT.Add.bind(null, exports.Rules.DropIncomingRequests),
        Iptables.Iptables.Filter.FORWARD.Add.bind(null, s_filter_fw),
        Iptables.Iptables.Filter.FORWARD.Add.bind(null, c_filter_fw),
        Iptables.Iptables.Filter.OUTPUT.Add.bind(null, s_filter_ot),
        Iptables.Iptables.Filter.OUTPUT.Add.bind(null, c_filter_ot),
        Iptables.Iptables.Mangle.PREROUTING.Add.bind(null, s_account_i),
        Iptables.Iptables.Mangle.POSTROUTING.Add.bind(null, s_account_o),
        Iptables.Iptables.NAT.PREROUTING.Add.bind(null, exports.Rules.HttpTrafficProxy),
        Iptables.Iptables.NAT.PREROUTING.Add.bind(null, s_nat_pre),
        Iptables.Iptables.NAT.POSTROUTING.Add.bind(null, s_nat_post),
        Iptables.Iptables.NAT.POSTROUTING.Add.bind(null, exports.Rules.UplinkNAT)
    ], cb);
}
function Initialize(cb) {
    async.series([
        InitNetwork,
        exports.Config.Initialize
    ], cb);
}
exports.Initialize = Initialize;
function ResolveSubnetMacFromIp(ipaddr, cb) {
    for (var lease in exports.dnsmasq.Leases.LeaseDB) {
        if (exports.dnsmasq.Leases.LeaseDB[lease].Address == ipaddr) {
            return cb(undefined, [lease, exports.dnsmasq.Leases.LeaseDB[lease].Interface]);
        }
    }
    var ipfromneigh = Native.ip.Neigh.GetByAddress_First(ipaddr);
    if (ipfromneigh) {
        return cb(undefined, [ipfromneigh.Mac, ipfromneigh.Dev]);
    }
    else {
        Native.ip.Neigh.GetByAddress_First_ActiveProbe(ipaddr, function (err, result) {
            if (!err && result) {
                return cb(undefined, [result.Mac, result.Dev]);
            }
            else {
                return cb(err, undefined);
            }
        });
    }
}
exports.ResolveSubnetMacFromIp = ResolveSubnetMacFromIp;
function SetCustomHost(lst, cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage) {
        exports.dnsmasq.Hosts[1] = lst;
    }
    else {
        curPackage.RegisterDeathHook("CUSTOMHOST", function (pkg) {
            _clearCustomHost(pkg.App.uid);
        });
        exports.dnsmasq.Hosts[curPackage.App.uid] = lst;
    }
    exports.dnsmasq.SIGHUP_Update(cb);
}
exports.SetCustomHost = SetCustomHost;
function GetCustomHost(cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (curPackage) {
        cb(undefined, exports.dnsmasq.Hosts[curPackage.App.uid]);
    }
    else {
        cb(undefined, exports.dnsmasq.Hosts[1]);
    }
}
exports.GetCustomHost = GetCustomHost;
function ClearCustomHost(cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage) {
        _clearCustomHost(1);
    }
    else {
        _clearCustomHost(curPackage.App.uid);
    }
    cb();
}
exports.ClearCustomHost = ClearCustomHost;
function _clearCustomHost(id) {
    exports.dnsmasq.Hosts[id] = {};
}
function SetCustomDNS(lst, cb) {
    if (!Array.isArray(lst)) {
        return cb(new Error("Not an Array"));
    }
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage) {
        exports.dnsmasq.DNSRules[1] = lst;
    }
    else {
        curPackage.RegisterDeathHook("CUSTOMDNS", function (pkg) {
            _clearCustomDNS(pkg.App.uid);
        });
        exports.dnsmasq.DNSRules[curPackage.App.uid] = lst;
    }
    exports.dnsmasq.SIGHUP_Update(cb);
}
exports.SetCustomDNS = SetCustomDNS;
function GetCustomDNS(cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (curPackage) {
        cb(undefined, exports.dnsmasq.DNSRules[curPackage.App.uid]);
    }
    else {
        cb(undefined, exports.dnsmasq.DNSRules[1]);
    }
}
exports.GetCustomDNS = GetCustomDNS;
function ClearCustomDNS(cb) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage) {
        _clearCustomDNS(1);
    }
    else {
        _clearCustomDNS(curPackage.App.uid);
    }
    cb();
}
exports.ClearCustomDNS = ClearCustomDNS;
function _clearCustomDNS(id) {
    exports.dnsmasq.DNSRules[id] = [];
}
var Configuration = (function (_super) {
    __extends(Configuration, _super);
    function Configuration() {
        var _this = this;
        _super.call(this);
        this.Default = {
            NetworkName: "edge-dev",
            RouterIP: "192.168.133.1",
            LocalNetmask: 24,
            Uplink: CONF.DEV.ETH.DEV_WAN,
            DNS: [
                {
                    UpStreamDNS: "114.114.114.114"
                },
                {
                    UpStreamDNS: "8.8.8.8"
                }
            ],
            DHCPHosts: {}
        };
        this._apply = function (mod, raw, cb) {
            if (!raw || Object.keys(raw).length == 0) {
                return cb();
            }
            var jobs = [];
            var dhcp_reboot = false;
            var dhcp_hotplug = false;
            var addr_change = false;
            var addr = {
                Address: _this.Get().RouterIP,
                Prefix: _this.Get().LocalNetmask
            };
            if (has(mod, "NetworkName")) {
                if (Core.Router.Phy.Wifi.WLAN_2G4 && Core.Router.Phy.Wifi.Config.Get()._2G4 && Core.Router.Phy.Wifi.Config.Get()._2G4.AutoSSID) {
                    Core.Router.Phy.Wifi.WLAN_2G4.Config.SSID = mod.NetworkName;
                    if (Core.Router.Phy.Wifi.Config.Get()._2G4.Power) {
                        Core.Router.Phy.Wifi.WLAN_2G4.Start(true);
                        jobs.push(Core.Router.Phy.Wifi.WLAN_2G4.StabilityCheck);
                    }
                }
                if (Core.Router.Phy.Wifi.WLAN_5G7 && Core.Router.Phy.Wifi.Config.Get()._5G7 && Core.Router.Phy.Wifi.Config.Get()._5G7.AutoSSID) {
                    Core.Router.Phy.Wifi.WLAN_5G7.Config.SSID = mod.NetworkName + "_5G";
                    if (Core.Router.Phy.Wifi.Config.Get()._5G7.Power) {
                        Core.Router.Phy.Wifi.WLAN_5G7.Start(true);
                        jobs.push(Core.Router.Phy.Wifi.WLAN_5G7.StabilityCheck);
                    }
                }
                if (Core.Router.Storage.SambaInstance && Core.Router.Storage.Config.Get().Samba && Core.Router.Storage.Config.Get().Samba.UseRouterName) {
                    Core.Router.Storage.SambaInstance.Config.CommonSections["global"]["Netbios_Name"] = mod.NetworkName.NetworkName;
                    Core.Router.Storage.SambaInstance.Start(true);
                    jobs.push(Core.Router.Storage.SambaInstance.StabilityCheck);
                }
            }
            if (has(mod, "RouterIP")) {
                dhcp_reboot = true;
                addr_change = true;
                exports.dnsmasq.Config.Listen_Address = mod.RouterIP;
                exports.dnsmasq.Hosts[0]["wi.fi"] = mod.RouterIP;
                exports.dnsmasq.Hosts[0]["wifi.network"] = mod.RouterIP;
                exports.dnsmasq.Hosts[0]["ed.ge"] = mod.RouterIP;
                exports.dnsmasq.Hosts[0]["wifi"] = mod.RouterIP;
                exports.dnsmasq.Config.Addresss[".wi.fi"] = mod.RouterIP;
                exports.dnsmasq.Config.Addresss[".wifi.network"] = mod.RouterIP;
                exports.dnsmasq.Config.Addresss[".ed.ge"] = mod.RouterIP;
                exports.dnsmasq.Config.Addresss[".wifi"] = mod.RouterIP;
                addr["Address"] = mod.RouterIP;
            }
            if (has(mod, "LocalNetmask")) {
                dhcp_reboot = true;
                exports.dnsmasq.Config.DHCPRange = {
                    Begin: ip.cidr_num(exports.dnsmasq.Config.Listen_Address, mod.LocalNetmask).replace(/\.0/g, ".10"),
                    End: ip.cidr_num(exports.dnsmasq.Config.Listen_Address, mod.LocalNetmask).replace(/\.0/g, ".230")
                };
                addr["Prefix"] = mod.LocalNetmask;
                addr_change = true;
            }
            if (has(mod, "Uplink")) {
                exports.Rules.UplinkNAT.Iface_Out = { Prefix: mod.Uplink, Id: "" };
                jobs.push(exports.Rules.UplinkNAT.Save);
            }
            if (has(raw, "DNS")) {
                dhcp_hotplug = true;
                exports.dnsmasq.DNSRules[0] = raw.DNS;
            }
            if (has(raw, "DHCPHosts")) {
                dhcp_hotplug = true;
                exports.dnsmasq.DHCP_Hosts[0] = raw.DHCPHosts;
            }
            if (addr_change) {
                exports.Rules.HttpTrafficProxy.Destination = {
                    Addr: addr.Address,
                    Prefix: addr.Prefix,
                    Negate: true
                };
                exports.Rules.DropIncomingRequests.Iface_In = {
                    Prefix: CONF.DEV.ETH.DEV_WAN,
                    Id: ""
                };
                exports.Rules.UplinkNAT.Source = {
                    Addr: addr.Address,
                    Prefix: addr.Prefix
                };
                jobs.push(exec.bind(null, "ifconfig " + " " + CONF.DEV.WLAN.DEV_2G + " " + addr.Address));
                jobs.push(exports.Rules.DropIncomingRequests.Save);
                jobs.push(exports.Rules.HttpTrafficProxy.Save);
                jobs.push(exports.Rules.UplinkNAT.Save);
            }
            if (dhcp_reboot) {
                exports.dnsmasq.Start(true);
                jobs.push(exports.dnsmasq.StabilityCheck);
            }
            else if (dhcp_hotplug) {
                jobs.push(exports.dnsmasq.ApplyChange);
                jobs.push(exports.dnsmasq.StabilityCheck);
            }
            if (jobs.length == 0) {
                cb();
            }
            else {
                async.series(jobs, cb);
            }
        };
        this.Initialize = function (cb) {
            _this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "LOCALNETWORK");
            _this.Reload(_this.Default, cb);
        };
    }
    return Configuration;
})(Abstract.Configurable);
function GetDeviceByIp(_ip, cb) {
    var conn = exports.Config.Get();
    var routerip = conn.RouterIP;
    var netmask = conn.LocalNetmask;
    var subnet = ip.cidr_num(_ip, netmask);
    var oursub = ip.cidr_num(routerip, netmask);
    if (oursub != subnet) {
        cb(new Error("Outside current subnet"));
    }
    else {
        Core.Router.Network.ResolveSubnetMacFromIp(_ip, function (err, mac_dev) {
            if (err || !mac_dev) {
                return cb(err, undefined);
            }
            else {
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
exports.GetDeviceByIp = GetDeviceByIp;
function Status(cb) {
}
exports.Status = Status;
exports.Config = new Configuration();
__API(GetDeviceByIp, "Network.GetDeviceByIp", [4 /* DeviceAccess */, 11 /* Network */, 12 /* Configuration */]);
__API(SetCustomDNS, "Network.DNS.Set", [11 /* Network */, 12 /* Configuration */]);
__API(ClearCustomDNS, "Network.DNS.Clear", [11 /* Network */, 12 /* Configuration */]);
__API(GetCustomDNS, "Network.DNS.Get", [11 /* Network */, 12 /* Configuration */]);
__API(SetCustomHost, "Network.Hosts.Set", [11 /* Network */, 12 /* Configuration */]);
__API(ClearCustomHost, "Network.Hosts.Clear", [11 /* Network */, 12 /* Configuration */]);
__API(GetCustomHost, "Network.Hosts.Get", [11 /* Network */, 12 /* Configuration */]);
__API(withCb(exports.Config.Get), "Network.Config.Get", [11 /* Network */, 12 /* Configuration */]);
__API(exports.Config.Apply, "Network.Config.Apply", [11 /* Network */, 12 /* Configuration */]);
__API(Status, "Network.Status", [11 /* Network */, 12 /* Configuration */]);
__API(GetDeviceByIp, "Proxy.CurrentDevHeader", Core.SubSys.FrontEnds.HttpProxy.NGINX_PERM_ARR);
