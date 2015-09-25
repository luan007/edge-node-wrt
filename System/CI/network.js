var fs = require("fs");
var command = require("../Processes/command"),
    exec = command.exec,
    md5_compare = command.md5_compare;

module.exports.translate = function(key, source, targetConfs, up_interface){
    if (key === "lan") {
        //routerip
        targetConfs["dhcp-option"] = [
            "46,8"
            , "6," + source.routerip
        ];
        targetConfs["listen-address"] = source.routerip + ",127.0.0.1";
        targetConfs["address"] = [
            "/.wi.fi/" + source.routerip
            , "/.wifi.network/" + source.routerip
            , "/.ed.ge/" + source.routerip
            , "/.wifi/" + source.routerip
        ];
        //set br0 ip
        exec("ifconfig", "br0", source.routerip);
        //netmask
        var networkAddress = source.routerip + "/" + source.netmask;
        exec("iptables", "-w", "-t", "nat", "-R", "nginx_proxy", "1", "-d", networkAddress, "-j", "RETURN");
        exec("iptables", '-w', '-t', "filter", '-R', "FORWARD", '1', '-c', 0, 0, //TODO: fill traffic data from DB
            '-s', networkAddress, '-o', up_interface, '-j', "internet_up_traffic");
        exec("iptables", '-w', '-t', "filter", '-R', "FORWARD", '2', '-c', 0, 0,
            '-d', networkAddress, '-i', up_interface, '-j', "internet_down_traffic");
        exec("iptables", '-w', '-t', "filter", '-R', "FORWARD", '3', '-c', 0, 0,
            '-s', networkAddress, '-d', networkAddress, '-j', "intranet_up_traffic");
        exec("iptables", '-w', '-t', "filter", '-R', "FORWARD", '4', '-c', 0, 0,
            '-s', networkAddress, '-d', networkAddress, '-j', "intranet_down_traffic");
    } else if (key === "dhcp_range") {
        targetConfs["dhcp-range"] = source.start + "," + source.end;
    } else if (key === "domain") {
        targetConfs["domain"] = source;
    } else if (key === "wan" && source.scheme === "ppp") {
        var secrets = source.ppp.account + "\t*\t" + source.ppp.passwd + "\n";
        console.log(secrets);
        fs.writeFileSync("/etc/ppp/pap-secrets", secrets, {flag:"w"});
        fs.writeFileSync("/etc/chap-secrets", secrets, {flag:"w"});
        //nat
        exec("iptables", "-w", "-t", "nat", "-R", "routing_masquerade", "1", "-j", "MASQUERADE", "-o", soource.up_interface);
    } else if (key === "dns") {
        var buf = "";
        source.forEach(function(ip) {
            buf += "server=" + ip + "\n";
        });
        var fname = "/ramdisk/System/Configs/dnsmasq_server_file.conf";
        buf = buf.trim("\n");
        if(!md5_compare(fname, buf)) {
            fs.writeFileSync(fname, buf, {flag: "w"});
        }
    }
}
