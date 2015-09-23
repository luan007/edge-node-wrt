var fs = require("fs");
var exec = require("../Processes/command").exec;

module.exports.translate = function(key, source, targetConfs){
    if (key === "lan") {
        //routerip
        targetConfs["dhcp-option"] = [
            "46,8"
            , "6," + source.routerip
        ];
        targetConfs["listen-address"] = source + ",127.0.0.1";
        targetConfs["address"] = [
            "/.wi.fi/" + source.routerip
            , "/.wifi.network/" + source.routerip
            , "/.ed.ge/" + source.routerip
            , "/.wifi/" + source.routerip
        ];
        //netmask
        exec("iptables", "-w", "-t", "nat", "-R", "nginx_proxy", "1", "-d", source.routerip + "/" + source.netmask, "-j", "RETURN");
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
    }
}