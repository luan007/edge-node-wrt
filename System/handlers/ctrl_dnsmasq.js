var conf = "/ramdisk/System/externals/configs/dnsmasq.conf"
var LeaseDB = {};

function Config(cb) {
    var cfg = {};
    var routerIP = "192.168.66.1";
    cfg.Listen_Address = routerIP;
    cfg.Expand_Hosts = true;
    cfg.Stop_DNS_Rebind = true;
    cfg.Sequential_Ip = true;
    cfg.Domain = "edge_exp";
    cfg.DHCPRange = {
        Begin: ip.cidr_num(cfg.Listen_Address, 24).replace(/\.0/g, ".10"),
        End: ip.cidr_num(cfg.Listen_Address, 24).replace(/\.0/g, ".230")
    };
    cfg.Addresss = {};
    cfg.Addresss[".wi.fi"] = routerIP;
    cfg.Addresss[".wifi.network"] = routerIP;
    cfg.Addresss[".ed.ge"] = routerIP;
    cfg.Addresss[".wifi"] =  routerIP;
    cfg.Cache_Size = 4096;

    var cfgString = Cfg2Arg(cfg).join("\n");
    fs.writeFile(conf, cfgString, cb);
}

function Cfg2Arg(cfg) {
    var arrLst = ["-k"];
    arrLst.push("--dhcp-script=/ramdisk/System/externals/scripts/dnsmasq_send.sh");
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
    arrLst = arrLst.concat([
        "--addn-hosts=/ramdisk/System/externals/miscs/dnsmasq_dhcp_hostsfile.conf",
        "--dhcp-hostsfile=/ramdisk/System/externals/miscs/dnsmasq_addn_hosts.conf",
        "--servers-file=/ramdisk/System/externals/miscs/dnsmasq_server_file.conf"
    ]);
    return arrLst;
}

function Fetch(cb) {
    var client = require("../queue/client");
    client.Drain("DNSMASQ", function (buf) {
        var leases = JSON.parse(buf.toString());
        for (var i in leases) {
            var lease = leases[i].Lease;
            lease.Mac = lease.Mac.toLowerCase();
            switch (data.Action) {
                case "add":
                    console.log("Adding " + lease.Hostname + " " + lease.Address);
                    LeaseDB[lease.Mac] = lease;
                    break;
                case "old":
                    if (!_.isEqual(lease, LeaseDB[lease.Mac])) {
                        console.log("Changing " + lease.Hostname + " " + lease.Address);
                        LeaseDB[lease.Mac] = lease;
                    }
                    break;
                case "del":
                    console.log("Deleting " + lease.Hostname + " " + lease.Address);
                    delete LeaseDB[lease.Mac];
                    break;
            }
        }
        return cb(undefined, LeaseDB);
    });
}

function Start(cb) {
    fs.readFile(conf, function (err, buf) {
        if (err) return cb(err);
        var args = buf.toString().trim("\n").split("\n");

        var jobs = [];
        jobs.push(function(cb){
            exec("killall", "dnsmasq", function () { cb(); });
        });
        jobs.push(function(cb){
            exec("ifconfig", "br0", "192.168.66.1", function () { cb(); });
        });

        async.series(jobs, function() {
            var ps = child_process.spawn("dnsmasq", args, {detached: true});
            ps.stdout.on('data', function (data) {
                console.log(data.toString().cyan);
            });
            ps.stderr.on('data', function (data) {
                console.log('ps stderr: ' + data.toString().red);
            });
            cb();
        });
    });
}

module.exports.Config = Config;
module.exports.Start = Start;
module.exports.Fetch = Fetch;