var conf="/ramdisk/System/externals/configs/dnsmasq.conf"

function Config(cb) {
    var cfg = {};
    cfg.Listen_Address = "192.168.66.1";
    cfg.Expand_Hosts = true;
    cfg.Stop_DNS_Rebind = true;
    cfg.Sequential_Ip = true;
    cfg.Domain = "edge";
    cfg.DHCPRange = {
        Begin: ip.cidr_num(cfg.Listen_Address, 24).replace(/\.0/g, ".10"),
        End: ip.cidr_num(cfg.Listen_Address, 24).replace(/\.0/g, ".230")
    };

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

function Initialize(cb) {
    Config(function() {
       cb();
    });
}

module.exports.Config = Config;
module.exports.Initialize = Initialize;