var exec = require("../Processes/command").exec;

module.exports.translate = function(key, source, routerip, netmask){
    var iptables = "iptables",
        dev2G = "ap1",
        dev5G = "ap0",
        devGuest2G = "guest0",
        devGuest5G = "guest1";

    if(key === "VLAN_Isolation") {
       var dev2GVlanIsolation = source["WLAN2G"] && source["WLAN2G"] === true,
           dev5GVlanIsolation = source["WLAN5G"] && source["WLAN5G"] === true,
           devGuest2GVlanIsolation = source["WLAN2G_Guest"] && source["WLAN2G_Guest"] === true,
           devGuest5GVlanIsolation = source["WLAN5G_Guest"] && source["WLAN5G_Guest"] === true,
           newworkAddress = routerip + '/' + netmask;

        exec(iptables, '-w', '-t', 'filter', '-R', 'vlan_isolation', '1', '-s', newworkAddress, '-i', dev2G, '-j', !dev2GVlanIsolation ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'filter', '-R', 'vlan_isolation', '2', '-d', newworkAddress, '-i', dev2G, '-j', !dev2GVlanIsolation ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'filter', '-R', 'vlan_isolation', '3', '-s', newworkAddress, '-i', dev5G, '-j', !dev5GVlanIsolation ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'filter', '-R', 'vlan_isolation', '4', '-d', newworkAddress, '-i', dev5G, '-j', !dev5GVlanIsolation ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'filter', '-R', 'vlan_isolation', '5', '-s', newworkAddress, '-i', devGuest2G, '-j', !devGuest2GVlanIsolation ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'filter', '-R', 'vlan_isolation', '6', '-d', newworkAddress, '-i', devGuest2G, '-j', !devGuest2GVlanIsolation ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'filter', '-R', 'vlan_isolation', '7', '-s', newworkAddress, '-i', devGuest5G, '-j', !devGuest5GVlanIsolation ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'filter', '-R', 'vlan_isolation', '8', '-d', newworkAddress, '-i', devGuest5G, '-j', !devGuest5GVlanIsolation ? 'RETURN' : 'REJECT');

    } else if (key === "NAT") {
        var dev2GEnable = source["WLAN2G"] && source["WLAN2G"] === true,
            dev5GEnable = source["WLAN2G"] && source["WLAN2G"] === true,
            devGuest2GEnable = source["WLAN2G_Guest"] && source["WLAN2G_Guest"] === true,
            devGuest5GEnable = source["WLAN5G_Guest"] && source["WLAN5G_Guest"] === true;

        exec(iptables, '-w', '-t', 'nat', '-R', 'wifi_nat', '1', '-i', dev2G, '-j', dev2GEnable ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'nat', '-R', 'wifi_nat', '2', '-i', dev5G, '-j', dev5GEnable ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'nat', '-R', 'wifi_nat', '3', '-i', devGuest2G, '-j', devGuest2GEnable ? 'RETURN' : 'REJECT');
        exec(iptables, '-w', '-t', 'nat', '-R', 'wifi_nat', '4', '-i', devGuest5G, '-j', devGuest5GEnable ? 'RETURN' : 'REJECT');
    } else if(key === "EnableNginxProxy") {

        if (source === true) {
            exec(iptables, '-w', '-t', 'nat', '-R', 'nginx_proxy', '2', '-p', 'tcp', '--dport', '80', '-j', 'REDIRECT', '--to-ports', '3378');
            exec(iptables, '-w', '-t', 'nat', '-R', 'nginx_proxy', '3', '-p', 'tcp', '--dport', '443', '-j', 'REDIRECT', '--to-ports', '3128');
        }
        else {
            exec(iptables, '-w', '-t', 'nat', '-R', 'nginx_proxy', '2', '-p', 'tcp', '--dport', '80', '-j', 'RETURN');
            exec(iptables, '-w', '-t', 'nat', '-R', 'nginx_proxy', '3', '-p', 'tcp', '--dport', '443', '-j', 'RETURN');
        }

    }

}