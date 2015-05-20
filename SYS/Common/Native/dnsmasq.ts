var unix: any = require("unix-dgram");
import Process = require("./Process");
import path = require("path");
import child_process = require("child_process");
import fs = require("fs");
import net = require("net");
import util = require("util");
import os = require("os");
import events = require("events");
import crypto = require("crypto");

/*
 * 
 * TRACKING - 
The script itself is trivial:

#!/bin/sh

op="${1:-op}"
mac="${2:-mac}"
ip="${3:-ip}"
hostname="${4}"

tstamp="`date '+%Y-%m-%d %H:%M:%S'`"

topic="network/dhcp/${mac}"
payload="${op} ${ip} ${tstamp} (${hostname})"

 */


/*
 * 
 * DOMAIN SOCKET (UNIX）  listening on main process
 * 
 * "ADD" - "DEL" ... subprocess called by dnsmasq (onchange) (node)
 *  -> connects to unix domain socket
 *  -> relay
 *  1
 */

/*
 * 
 * old 28:47:aa:27:16:6c 192.168.9.168 Windows-Phone
old 28:47:aa:27:16:6c 192.168.9.168 Windows-Phone
old 28:47:aa:27:16:6c 192.168.9.168 Windows-Phone
add 60:03:08:a8:ae:b4 192.168.9.132 Bigmeat
add 00:26:bb:18:0a:0a 192.168.9.145
add 30:39:26:04:b7:ad 192.168.9.128 android-2a06a23c0e306f1c
add 18:af:61:6e:73:59 192.168.9.109 fff-iPhone



#! /bin/bash
echo "$*" | socat - UNIX-SENDTO:/tmp/test

 * 
 */


/*
 * >add 28:47:aa:27:16:6c 192.168.9.9 Windows-Phone
>CLIENT ID = 01:28:47:aa:27:16:6c
>DOMAIN = doge
>VENDOR_CLASS = MSFT 5.0
>SUPPLIED_HOSTNAME = Windows-Phone
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904551
>TIME_REMAINING = 3600
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  = known wlan1
>old 28:47:aa:27:16:6c 192.168.9.9 Windows-Phone
>CLIENT ID = 01:28:47:aa:27:16:6c
>DOMAIN = doge
>VENDOR_CLASS =
>SUPPLIED_HOSTNAME =
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904551
>TIME_REMAINING = 3477
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  =
>IAID  =
>old 28:47:aa:27:16:6c 192.168.9.9 Windows-Phone
>CLIENT ID = 01:28:47:aa:27:16:6c
>DOMAIN = doge
>VENDOR_CLASS =
>SUPPLIED_HOSTNAME =
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904551
>TIME_REMAINING = 3477
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  =
>IAID  =
>old 28:47:aa:27:16:6c 192.168.9.9 Windows-Phone
>CLIENT ID = 01:28:47:aa:27:16:6c
>DOMAIN = doge
>VENDOR_CLASS =
>SUPPLIED_HOSTNAME =
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904551
>TIME_REMAINING = 3414
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  =
>IAID  =
>SERVER_DUID  =
>old 28:47:aa:27:16:6c 192.168.9.9 Windows-Phone
>CLIENT ID = 01:28:47:aa:27:16:6c
>DOMAIN = doge
>VENDOR_CLASS =
>SUPPLIED_HOSTNAME =
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904551
>TIME_REMAINING = 3414
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  =
>IAID  =
>SERVER_DUID  =
>old 28:47:aa:27:16:6c 192.168.9.9 Windows-Phone
>CLIENT ID = 01:28:47:aa:27:16:6c
>DOMAIN = doge
>VENDOR_CLASS = MSFT 5.0
>SUPPLIED_HOSTNAME = Windows-Phone
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904775
>TIME_REMAINING = 3600
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  = known wlan1
>IAID  =
>SERVER_DUID  =
>add 0c:8b:fd:96:81:83 192.168.9.182 EmergeStation
>CLIENT ID = 01:0c:8b:fd:96:81:83
>DOMAIN = doge
>VENDOR_CLASS = MSFT 5.0
>SUPPLIED_HOSTNAME = EmergeStation
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904873
>TIME_REMAINING = 3600
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  = wlan1
>IAID  =
>SERVER_DUID  =
>add 60:03:08:a8:ae:b4 192.168.9.132 Bigmeat
>CLIENT ID = 01:60:03:08:a8:ae:b4
>DOMAIN = doge
>VENDOR_CLASS =
>SUPPLIED_HOSTNAME = Bigmeat
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904891
>TIME_REMAINING = 3600
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  = wlan1
>IAID  =
>SERVER_DUID  =
>add 18:af:61:6e:73:59 192.168.9.109 fff-iPhone
>CLIENT ID = 01:18:af:61:6e:73:59
>DOMAIN = doge
>VENDOR_CLASS =
>SUPPLIED_HOSTNAME = fff-iPhone
>USER_CLASS0 =
>LEASE_LENGTH =
>LEASE_EXPIRES = 1402904943
>TIME_REMAINING = 3600
>OLD_HOSTNAME =
>INTERFACE  = wlan1
>TAGS  = wlan1
>IAID  =
>SERVER_DUID  =
 * 
 */


export interface IDHCPLease {
    Mac: string;
    Address: string;
    Hostname: string;
    VendorClass: string;
    Interface: string;
}

/*
 * {
 *      "Action": "old",
 *      "Lease": {
 *          "MAC": "28:47:aa:27:16:6c",
 *          "Address": "192.168.9.9",
 *          "Hostname": "Windows-Phone",
 *          "VendorClass": "MSFT 5.0",
 *          "Interface": "wlan1"
 *       }
 *  }
 * 
 */

interface ILeaseEventPacket {
    Lease: IDHCPLease;
    Action: string;
}

export class DHCPLeaseManager extends events.EventEmitter {

    /*
     * root@ubuntu:/var/lib/misc# cat dnsmasq.leases 
       1402846613 30:39:26:04:b7:ad 192.168.9.128 android-2a06a23c0e306f1c *
       1402845498 28:47:aa:27:16:6c 192.168.9.9 Windows-Phone 01:28:47:aa:27:16:6c
     */

    /**
     * DOES NOT MATTER
     * THANK YOU LEASE FILE
     */

    private WatchList: IDic<(data: IDHCPLease) => any> = {};

    public static EVENT_ADD = "add";

    public static EVENT_CHANGE = "change";

    public static EVENT_DEL = "del";

    public LeaseDB : IDic<IDHCPLease> = {}; //keyed by macaddress

    private _socketclient;

    constructor(private relay_path) {
        super();
    }

    Listen = () => {
        if (this._socketclient) {
            this._socketclient.close();
            this._socketclient = null;
        }
        //generate the relay
        //var jobs = [];
        var sock = getSock(UUIDstr());
        //jobs.push((cb) => {
        //    if (0) {//os.cpus()[0].model.lastIndexOf("arm") >= 0) {
        //        recho("#!/bin/ash\necho \"{ \\\"Action\\\":\\\"$1\\\", \\\"Lease\\\": { \\\"MAC\\\":\\\"$2\\\", \\\"Address\\\":\\\"$3\\\", \\\"Hostname\\\":\\\"$4\\\", \\\"VendorClass\\\":\\\"$DNSMASQ_VENDOR_CLASS\\\", \\\"Interface\\\":\\\"$DNSMASQ_INTERFACE\\\" }}\" | socat - UNIX-SENDTO:/tmp/dnsmasq_event_socket",
        //            this.relay_id, true, cb);
        //    } else {
        //        recho("#!/bin/bash\necho \"{ \\\"Action\\\":\\\"$1\\\", \\\"Lease\\\": { \\\"MAC\\\":\\\"$2\\\", \\\"Address\\\":\\\"$3\\\", \\\"Hostname\\\":\\\"$4\\\", \\\"VendorClass\\\":\\\"$DNSMASQ_VENDOR_CLASS\\\", \\\"Interface\\\":\\\"$DNSMASQ_INTERFACE\\\" }}\" | socat - UNIX-SENDTO:/tmp/dnsmasq_event_socket",
        //            _Socket_Relay_Path + ".virtual", true, cb);
        //    }
        //});


        if (fs.existsSync(this.relay_path) && fs.unlinkSync(this.relay_path));
        if (fs.existsSync(sock) && fs.unlinkSync(sock));
        var d = "#!/bin/bash\necho \"{ \\\"Action\\\":\\\"$1\\\", \\\"Lease\\\": { \\\"Mac\\\":\\\"$2\\\", \\\"Address\\\":\\\"$3\\\", \\\"Hostname\\\":\\\"$4\\\", \\\"VendorClass\\\":\\\"$DNSMASQ_VENDOR_CLASS\\\", \\\"Interface\\\":\\\"$DNSMASQ_INTERFACE\\\" }}\" | socat - UNIX-SENDTO:" + sock;
        fs.writeFileSync(this.relay_path, d);
        info("Relay Generated at " + this.relay_path);
        fs.chmodSync(this.relay_path, 777); //woo
        info("Relay getting +0777 - wooo");
        var client = unix.createSocket('unix_dgram', this._onrawdata); //well well
        this._socketclient = client;
        client.bind(sock);
        fs.chmodSync(sock, 777); //woo
        client.on('error', (err) => {
            error("DNSMASQ ERROR");
            error(err);
        });
        info("DNSMASQ Event Hook Online");

        //jobs.push((cb) => {
        //    warn("*WORKAROUND* NON-CLOSING FD DURING VM_FUSE SESSION - line 264");
        //    cb();
        //});

        //jobs.push((cb) => {
        //    rcp(_Socket_Relay_Path + ".virtual", _Socket_Relay_Path, cb);
        //});

    };

    _onrawdata = (buf, rinfo) => {
        var data: ILeaseEventPacket = JSON.parse(buf.toString());
        //add old del
        var lease = data.Lease;
        lease.Mac = lease.Mac.toLowerCase();
        switch (data.Action) {
            case "add":
                info("Adding " + lease.Hostname + " " + lease.Address);
                this.LeaseDB[lease.Mac] = lease;
                if (this.WatchList[lease.Mac] !== undefined) {
                    this.WatchList[lease.Mac](lease);
                }
                this.emit(DHCPLeaseManager.EVENT_ADD, lease);
                break;
            case "old":
                if (!_.isEqual(lease, this.LeaseDB[lease.Mac])) {
                    info("Changing " + lease.Hostname + " " + lease.Address);
                    this.LeaseDB[lease.Mac] = lease;
                    if (this.WatchList[lease.Mac] !== undefined) {
                        this.WatchList[lease.Mac](lease);
                    }
                    this.emit(DHCPLeaseManager.EVENT_CHANGE, lease);
                }
                break;
            case "del":
                info("Deleting " + lease.Hostname + " " + lease.Address);
                delete this.LeaseDB[lease.Mac];
                if (this.WatchList[lease.Mac] !== undefined) {
                    this.WatchList[lease.Mac](undefined);
                }
                this.emit(DHCPLeaseManager.EVENT_DEL, lease);
                break;
        }
    };

    public Watch(mac, callback: (data: IDHCPLease) => any) {
        this.WatchList[mac] = callback;
    }

    public Unwatch(mac) {
        this.WatchList[mac] = undefined;
    }

    Initialize = () => {
        if (!this._socketclient) {
            this.Listen();
        }
    };
}

/**
 * -V, --alias=[<old-ip>]|[<start-ip>-<end-ip>],<new-ip>[,<mask>] 
 * Modify IPv4 addresses returned from upstream nameservers; 
 * old-ip is replaced by new-ip. 
 * If the optional mask is given then any address which matches the masked old-ip 
 * will be re-written. 
 * So, for instance --alias=1.2.3.0,6.7.8.0,255.255.255.0  
 * will map 1.2.3.56 to 6.7.8.56 and 1.2.3.67 to 6.7.8.67. 
 * This is what Cisco PIX routers call "DNS doctoring".
 * If the old IP is given as range, then only addresses in the range, 
 * rather than a whole subnet, are re-written. 
 * So --alias=192.168.0.10-192.168.0.40,10.0.0.0,255.255.255.0 maps 192.168.0.10->192.168.0.40 to 
 * 10.0.0.10->10.0.0.40 
 */

export interface IpAlias {
    Match: {
        OldIp: string;
        End?: string;
    };
    NewIp: string;
    Mask?: string;
}

export interface ServerRule {
    UpStreamDNS?: string;
    UpStreamPort?: string;
    Domains?: string[];

}

export class ConfigInterface {
    //no host

    public Listen_Address: string;

    public Expand_Hosts: boolean = true;

    public Bogus_Private_Reverse_Lookup: boolean = false;

    public AliasList: IpAlias[] = [];

    //no resolv, no poll

    public Stop_DNS_Rebind: boolean = true;

    public Cache_Size: number = 4096;

    public DNS_MultiServer_Query: boolean = false;

    /**
     * DOMAIN - IP
     * NOT suggested
     */
    public Addresss: IDic<string> = {};

    /**
     * DOMAIN - IPSET
     */
    public CaptureDomainIntoIpSet: IDic<string> = {};

    /**
     * DOMAIN - IP
     * Suggested
     */
    public Hosts: IDic<string> = {};

    //public DHCP_Script = _Socket_Relay_Path;

    public Sequential_Ip: boolean = true;

    //DOMAIN

    public DHCPRange: { Begin: string; End: string; };

    public Domain: string = "edge";

}


function ConfigToArg(cfg: ConfigInterface, relay_path) {

    var arrLst = ["-k"]; //["-k", "-h", "-R", "-n"]; //-k dont die! -h no hosts! -R no resolv! -n no Poll!
    arrLst.push("--dhcp-script=" + relay_path);
    //arrLst.push("--dhcp-script=" + "/tmp/test.sh");
    //arrLst.push("--dhcp-script=/bin/echo \"logg\" > /root/ao");
    //TAKE THIS AS WINS SERVER
    //arrLst.push("--dhcp-hostsfile=" + hosts_path);
    //arrLst.push("--resolv-file=" + resolv_path);
    //arrLst.push("--dhcp-option=44,0.0.0.0");
    //arrLst.push("--dhcp-option=45,0.0.0.0");
    arrLst.push("--dhcp-option=46,8");
    arrLst.push("--dhcp-option=6," + cfg.Listen_Address);
    if (cfg.Listen_Address && cfg.Listen_Address != "") {
        arrLst.push("--listen-address=" + cfg.Listen_Address + ",127.0.0.1");
    }
    if (cfg.Bogus_Private_Reverse_Lookup) {
        arrLst.push("-b");
    }
    if (cfg.Expand_Hosts) {
        arrLst.push("--expand-hosts");
    }
    if (cfg.DNS_MultiServer_Query) {
        arrLst.push("--all-servers");
    }
    if (cfg.Stop_DNS_Rebind) {
        arrLst.push("--stop-dns-rebind");
    }
    if (cfg.Sequential_Ip) {
        arrLst.push("--dhcp-sequential-ip");
    }
    if (cfg.Domain && cfg.Domain != "") {
        arrLst.push("--domain=" + cfg.Domain);
    }
    if (cfg.DHCPRange) {
        arrLst.push("--dhcp-range=" + cfg.DHCPRange.Begin + "," + cfg.DHCPRange.End);
    }
    if (cfg.Cache_Size) {
        arrLst.push("--cache-size=" + cfg.Cache_Size);
    }
    if (cfg.AliasList) {
        for (var i = 0; i < cfg.AliasList.length; i++) {
            var a = cfg.AliasList[i];
            if (a.Match && a.NewIp && a.Match.OldIp) {
                arrLst.push("--alias=" + a.Match.OldIp + ((a.Match.End && a.Match.End != "") ? ("-" + a.Match.End + ",") : ",")
                    + a.NewIp + ((a.Mask && a.Mask != "") ? ("," + a.Mask) : ""));
            }
        }
    }
    if (cfg.Addresss) {
        for (var t in cfg.Addresss) {
            if (!cfg.Addresss.hasOwnProperty(t)) {
                continue;
            }
            arrLst.push("--address=/" + t + "/" + cfg.Addresss[t]);
        }
    }
    if (cfg.Hosts) {
        for (var t in cfg.Hosts) {
            if (!cfg.Hosts.hasOwnProperty(t)) {
                continue;
            }
            arrLst.push("--host-record=" + t + "," + cfg.Hosts[t]);
        }
    }

    if (cfg.CaptureDomainIntoIpSet) {
        for (var t in cfg.CaptureDomainIntoIpSet) {
            if (!cfg.CaptureDomainIntoIpSet.hasOwnProperty(t)) {
                continue;
            }
            arrLst.push("--ipset=/" + t + "/" + cfg.CaptureDomainIntoIpSet[t]);
        }
    }

    return arrLst;
}

export class dnsmasq extends Process {

    private relay_path = getSock(UUIDstr());

    private hosts_path = getSock(UUIDstr());

    private dhcp_host_path = getSock(UUIDstr());

    private dns_path = getSock(UUIDstr());

    //private hosts_path = getSock(UUIDstr());

    //private resolv_path = getSock(UUIDstr());

    public Leases: DHCPLeaseManager = new DHCPLeaseManager(this.relay_path);

    public Config: ConfigInterface = new ConfigInterface();

    public Hosts /* hosts[hostname] = IP_addr */ = [{}, {}];

    //[Static, Dynamic]
    public DNSRules: ServerRule[][] = [[],[]];

    private _cache: any = {};

    /**
     * Mac - Ip ( static ip )
     */
    //[Static, Dynamic]
    public DHCP_Hosts = [{}, {}];

    public CheckNameAvailability = (name, cb, caseSensitive = false) => {
        name = (name + "").trim();
        if (!caseSensitive) {
            name = name.toLowerCase();
        }
        forEachFlat(this.Hosts,(hosts, flag) => {
            if (!hosts) return;
            for (var i in hosts) {
                if (!caseSensitive) {
                    i = i.toLowerCase();
                }
                if (i == name) {
                    flag.stop = true;
                    return cb(false);
                }
            }
        });
        return cb(true);
    };

    constructor() {
        super("DNSMASQ");
    }

    //TODO: Support SIGHUP based Hotplug
    //      No more wait'in yo
    //--dhcp-hostsfile   <<----- host record.. complicated :(
    //--addn-hosts       <<----- /etc/hosts
    //--dhcp-optsfile    <<----- optional
    //--read-ethers      <<----- arp?
    //--servers-file     <<----- dns... 
    private flush = (cb) => {
        var changed = false;
        var _hosts = "";
        
        forEachFlat(this.Hosts,(host) => {
            if (!host) return;
            for (var t in host) {
                if (!has(host, t)) return;
                _hosts += host[t] + " " + t;
                _hosts += "\r\n";
            }
        });

        var _dns = "";
        if (this.DNSRules) {
            forEachFlat(this.DNSRules,(rule) => {
                var c = "";
                if (rule.Domains && rule.Domains.length > 0) {
                    c += "/";
                    for (var j = 0; j < rule.Domains.length; j++) {
                        c += rule.Domains[j]; + "/";
                    }
                }
                if (rule.UpStreamDNS && rule.UpStreamDNS != "") {
                    c += rule.UpStreamDNS;
                    if (rule.UpStreamPort) {
                        c += "#" + rule.UpStreamPort;
                    }
                } else if (c != "") {
                    c += "#";
                } else {
                    return;
                }
                _dns += "server=" + c + "\r\n";
            });
        }
        var _dhcp_hosts = "";
        if (this.DHCP_Hosts) {
            forEachFlat(this.DHCP_Hosts,(hosts) => {
                if (!hosts) return;
                for (var t in hosts) {
                    if (!hosts.hasOwnProperty(t)) {
                        continue;
                    }
                    _dhcp_hosts += t + "," + hosts[t] + "\r\n";
                }
            });
        }

        if (!(this._cache._hosts == _hosts
            && this._cache._dns == _dns
            && this._cache._dhcp_hosts == _dhcp_hosts)) {
            changed = true;
            this._cache._hosts = _hosts;
            this._cache._dns = _dns;
            this._cache._dhcp_hosts = _dhcp_hosts;
        }
        if (!changed) {
            trace("DNSMASQ found no change, nothing to do :p");
            return cb(undefined, "nochange");
        }
        else {
            trace(_hosts);
            trace(_dns);
            trace(_dhcp_hosts);
        }
        async.series(
            [
                exec.bind(null, "rm -rf " + this.hosts_path),
                exec.bind(null, "rm -rf " + this.dns_path),
                exec.bind(null, "rm -rf " + this.dhcp_host_path),
                fs.writeFile.bind(null, this.hosts_path, _hosts),
                fs.writeFile.bind(null, this.dns_path, _dns),
                fs.writeFile.bind(null, this.dhcp_host_path, _dhcp_hosts)
            ], cb);
    };

    SIGHUP_Update = (cb) => {
        setTask("DNSMASQ_sighup", () => {
            intoQueue("DNSMASQ_sighup",(c) => {
                fatal("Dnsmasq_Hotplug: in progress..");
                this.flush((err, result) => {
                    if (result == "nochange") {
                        return c();
                    }
                    if (this.Process) {
                        this.Process.kill("SIGHUP"); //no more rebootz, BITCHES
                        info("OK");
                    }
                    else {
                        this.Start(true);
                    }
                    c();
                });
            }, cb);
        }, 1500); //speedy? no.
    };

    Start(forever: boolean = true) {
        if (!this.IsChoking()) {
            this.Leases.Initialize();
            killall("dnsmasq", () => {
                if (this.Process) {
                    this.Process.kill();
                }
                this.flush(() => {
                    this.Process = child_process.spawn("dnsmasq", ConfigToArg(this.Config, this.relay_path).concat(
                        [
                            "--addn-hosts=" + this.hosts_path,
                            "--dhcp-hostsfile=" + this.dhcp_host_path,
                            "--servers-file=" + this.dns_path
                        ]
                        )); //dont die..
                    //trace(this.Ctrl.toArgs(this.relay_path));
                    super.Start(forever);
                });
            });
        }
    }

    ApplyChange = (cb) => {
        this.Stop(true);
        cb();
    };

    public OnChoke() {
        warn("Killing all DNSMASQ processes");
        killall("dnsmasq", () => {
            info("Done, waiting for recall");
            this.Choke_Timer = setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 2000);
        });
        return true;
    }

}
