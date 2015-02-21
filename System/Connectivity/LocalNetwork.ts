import Node = require("Node");
import Core = require("Core");
import Native = Core.SubSys.Native;
import Abstract = Core.Lib.Abstract;
import Iptables = Native.iptables;
import Dnsmasq = Native.dnsmasq;

class _localNetwork extends Abstract.Configurable {

    REMOTE_BYPASS: Iptables.Chain;

    DROP_NEW_INCOMING_CONN: Iptables.Rule;

    NAT_OUT: Iptables.Rule;

    PROXY_OUT: Iptables.Rule;

    REMOTE_IN: Iptables.Rule;

    DNSMASQ: Dnsmasq.dnsmasq;

    Instance: _localNetwork;

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
        ]
    };

    constructor() {
        super();
        this.Instance = this;
    }

    protected _apply = (mod, cb: Callback) => {
        if (!mod || Object.keys(mod).length == 0) {
            return cb(); //nothing changed
        }
        var jobs = [];
        var dhcp_reboot = false;
        var dhcp_hotplug = false;

        var addr = {
            Address: this.Config().RouterIP,
            Prefix: this.Config().LocalNetmask
        };
        var addr_change = false;
        if (has(mod, "NetworkName")) {
            if (Core.Connectivity.Wifi.WLAN_2G4 && Core.Connectivity.Wifi.Config()._2G4 && Core.Connectivity.Wifi.Config()._2G4.AutoSSID == true) {
                Core.Connectivity.Wifi.WLAN_2G4.Config.SSID = mod.NetworkName;
                Core.Connectivity.Wifi.WLAN_2G4.Start(true);
                jobs.push(Core.Connectivity.Wifi.WLAN_2G4.StabilityCheck);
            }
        }
        if (has(mod, "RouterIP")) {
            dhcp_reboot = true;
            this.DNSMASQ.Config.Listen_Address = mod.RouterIP;
            addr["Address"] = mod.RouterIP;
            this.DNSMASQ.Hosts["wi.fi"] = mod.RouterIP;
            this.DNSMASQ.Hosts["wifi.network"] = mod.RouterIP;
            this.DNSMASQ.Hosts["ed.ge"] = mod.RouterIP;
            addr_change = true;
        }
        if (has(mod, "LocalNetmask")) {
            dhcp_reboot = true;
            this.DNSMASQ.Config.DHCPRange = {
                Begin: ip.cidr_num(this.DNSMASQ.Config.Listen_Address, mod.LocalNetmask).replace(/\.0/g, ".10"),
                End: ip.cidr_num(this.DNSMASQ.Config.Listen_Address, mod.LocalNetmask).replace(/\.0/g, ".230")
            };
            addr["Prefix"] = mod.LocalNetmask;
            addr_change = true;
        }
        if (has(mod, "Uplink")) {
            this.NAT_OUT.Iface_Out = { Prefix: mod.Uplink, Id: <any>"" };
            jobs.push(this.NAT_OUT.Save);
        }
        if (has(mod, "DNS")) {
            dhcp_hotplug = true;
            this.DNSMASQ.DNSRules = mod.DNS;
        }
        if (addr_change) {
            this.PROXY_OUT.Destination = {
                Addr: addr.Address,
                Prefix: addr.Prefix,
                Negate: true
            };
            this.REMOTE_IN.Iface_In = {
                Prefix: CONF.DEV.ETH.DEV_WAN,
                Id: <any>""
            };
            this.DROP_NEW_INCOMING_CONN.Iface_In = {
                Prefix: CONF.DEV.ETH.DEV_WAN,
                Id: <any>""
            };
            jobs.push(this.DROP_NEW_INCOMING_CONN.Save.bind(null));
            jobs.push(this.PROXY_OUT.Save.bind(null));
            jobs.push(this.REMOTE_IN.Save.bind(null));
            jobs.push(Native.ip.Addr.Set_Flush.bind(null, CONF.DEV.WLAN.DEV_2G, addr));
        }
        if (dhcp_reboot) {
            this.DNSMASQ.Start(true);
            jobs.push(this.DNSMASQ.StabilityCheck);
        } else if (dhcp_hotplug) {
            jobs.push(this.DNSMASQ.SIGHUP_Update);
            jobs.push(this.DNSMASQ.StabilityCheck);
        }
        if (jobs.length == 0) {
            cb(); //success!
        } else {
            async.parallel(jobs, cb);
        }
    };

    public ResolveSubnetMacFromIp = (ipaddr, cb: PCallback<[string, string]>) => {
        for (var lease in this.DNSMASQ.Leases.LeaseDB) {
            if (this.DNSMASQ.Leases.LeaseDB[lease].Address == ipaddr) {
                return cb(undefined, [lease, this.DNSMASQ.Leases.LeaseDB[lease].Interface]);
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
    };



    public Initialize = (cb) => {
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "LOCALNETWORK");

        this.PROXY_OUT = new Iptables.Rule();
        this.PROXY_OUT.Protocol = { TCP: true };
        this.PROXY_OUT.Destination_Port = { Id: 80 };
        this.PROXY_OUT.Target = Iptables.Target_Type.REDIRECT;
        this.PROXY_OUT.TargetOptions = <Iptables.IRedirectOption>{
            Port: {
                Id: 3378
            }
        };

        this.REMOTE_BYPASS = new Iptables.Chain("Remote_Bypass", Iptables.Iptables.Filter);
        

        this.REMOTE_IN = new Iptables.Rule();
        this.REMOTE_IN.Target = Iptables.Target_Type.CHAIN;
        this.REMOTE_IN.TargetOptions = <Iptables.IChainOption>{
            Chain: "Remote_Bypass"
        };


        this.DROP_NEW_INCOMING_CONN = new Iptables.Rule();
        this.DROP_NEW_INCOMING_CONN.Match_State = <Iptables.IState> {
            NEW: true
        };
        this.DROP_NEW_INCOMING_CONN.Target = Iptables.Target_Type.DROP;


        //this.REMOTE_BYPASS.on("traffic",() => {
        //    warn("BLOCK");
        //});



        this.NAT_OUT = new Iptables.Rule();
        this.NAT_OUT.Iface_Out = { Prefix: this.Default.Uplink, Id: <any>"" };
        this.NAT_OUT.Target = Iptables.Target_Type.MASQUERADE;
        

        //this.NAT_OUT.on("traffic", (g, bytes, prev, pkgs, deltaT) => {
        //    info(this.NAT_OUT.Count_Bytes);
        //});

        this.DNSMASQ = new Dnsmasq.dnsmasq();
        async.series([
            exec.bind(null, "echo 1 > /proc/sys/net/ipv4/ip_forward"),
            exec.bind(null, "echo 1 > /proc/sys/net/ipv6/conf/default/forwarding"),
            exec.bind(null, "echo 1 > /proc/sys/net/ipv6/conf/all/forwarding"),
            Iptables.Iptables.Filter.AddChain.bind(null, this.REMOTE_BYPASS),
            Iptables.Iptables.Filter.INPUT.Add.bind(null, this.REMOTE_IN),
            Iptables.Iptables.Filter.INPUT.Add.bind(null, this.DROP_NEW_INCOMING_CONN),
            Iptables.Iptables.NAT.PREROUTING.Add.bind(null, this.PROXY_OUT),
            Iptables.Iptables.NAT.POSTROUTING.Add.bind(null, this.NAT_OUT),
            this.Reload.bind(this, this.Default, cb)
        ], cb);
    };

}

//singleton :p
var _export = new _localNetwork();
export = _export;