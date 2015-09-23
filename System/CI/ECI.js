/**
 * ECI
 *
 * invocation:
 *
 *      ECI network set
 *      ECI network get key
 *
 */
var fs = require("fs");

var res = {
    success: false,
    result: ""
};
var output = function (obj) {
    return console.log(JSON.stringify(obj));
}

if (process.argv.length < 4) {
    res.result = "arguments missing";
    return output(res);
}
var entry = process.argv[2];
var command = process.argv[3];
var __DNSMASQ = "dnsmasq";
var __HOSTAPD2G = "hostapd2g";
var __HOSTAPD5G = "hostapd5g";
var __HOSTS = "hosts";
var confs = {};
confs[__DNSMASQ] = "/etc/dnsmasq.conf";
confs[__HOSTAPD2G] = "/etc/hostapd_2g.conf";
confs[__HOSTAPD5G] = "/etc/hostapd_5g.conf";
confs[__HOSTS] = "/ramdisk/System/Configs/hostapd_addn_hosts.conf";

var __NETWORK = "network";
var __WIFI = "wifi";
var __FIREWALL = "firewall";
var __SYSTEM = "system";
var __TIME = "time";
var __SSH = "ssh";
var entries = {};
entries[__NETWORK] = "/etc/network.json";
entries[__WIFI] = "/etc/wifi.json";
entries[__FIREWALL] = "/etc/firewall.json";
entries[__SYSTEM] = "/etc/system.json";
entries[__TIME] = "/etc/time.json";
entries[__SSH] = "/etc/ssh.json";
entries[__HOSTS] = "/etc/hosts.json";

var targetConfs = {};
function readConfig(cname) {
    targetConfs[cname] = targetConfs[cname] || {};
    var conf = confs[cname];
    var delimiter = "=";
    var line = "\n";
    var rows = fs.readFileSync(conf).toString().split(line);

    rows.forEach(function (row) {
        var parts = row.split(delimiter);
        var row = parts[0];
        var val = parts[1];
        if(targetConfs[cname][row]){
            var old = targetConfs[cname][row];
            targetConfs[cname][row] = [];
            if(Array.isArray(old))
                targetConfs[cname][row].concat(old);
            else
                targetConfs[cname][row].push(old);
            targetConfs[cname][row].push(val !== undefined ? row + "=" + val : row);
        } else {
            targetConfs[cname][row] = val;
        }
    });
}
var sourceConfs = {};
function readEntry(ename) {
    var conf = entries[ename];
    sourceConfs[ename] = JSON.parse(fs.readFileSync(conf).toString());
}
function writeConf(cname) {
    var buf = "";
    for (var row in targetConfs[cname]) {
        var o = targetConfs[cname][row];
        if(Array.isArray(o))
            o.forEach(function (c) {
                buf += row + "=" + c + "\n";
            });
        else if(typeof o === "string")
            buf += (o.trim() ? row + "=" + o.toString() : row) + "\n";
        else if(o === undefined) {
            buf += row + "\n";
        }
    }
    fs.writeFileSync(confs[cname], buf);
}

if (!entries.hasOwnProperty(entry)) {
    res.result = "illegal entry";
    return output(res);
} else if (entry === __NETWORK) {
    readConfig(__DNSMASQ);
} else if (entry === __WIFI) {
    readConfig(__HOSTAPD2G);
    readConfig(__HOSTAPD5G);
} else if (entry === __HOSTS) {
    readConfig(__HOSTS);
} else if(entry === __FIREWALL) {
    readEntry(__NETWORK);
}
readEntry(entry);

//TODO: translation
if (command === "get") {

    var key = process.argv[4];

    if (sourceConfs[entry][key]) {
        res.success = true;
        res.result = sourceConfs[entry][key];
        return output(res);
    }
    else {
        res.result = "key not found";
        return output(res);
    }

} else if (command === "set") {

    var translator = undefined;

    var tbw = {};
    for (var k in sourceConfs[entry]) {
        var val = sourceConfs[entry][k];

        if (entry === __NETWORK) { //** NETWORK
            translator = require("./network");
            translator.translate(k, val, targetConfs[__DNSMASQ], sourceConfs[__NETWORK].wan.up_interface);
            tbw[__DNSMASQ] = tbw[__DNSMASQ] || "";
        } else if (entry === __WIFI) { //** WIRELESS
            translator = require("./wlan");
            if (k === "wlan2g") {
                translator.translate(val, targetConfs[__HOSTAPD2G]);
                tbw[__HOSTAPD2G] = tbw[__HOSTAPD2G] || "";
            } else if (k === "wlan5g") {
                translator.translate(val, targetConfs[__HOSTAPD5G]);
                tbw[__HOSTAPD5G] = tbw[__HOSTAPD5G] || "";
            }
        } else if(entry == __HOSTS) { //** HOSTS
            translator = require("./hosts");
            translator.translate(k, val, targetConfs[__HOSTS]);
        } else if(entry === __FIREWALL) { //** FIREWALL
            translator = require("./firewall");
            translator.translate(k, val, sourceConfs[__NETWORK].lan.routerip, sourceConfs[__NETWORK].lan.netmask);
        }
    }

    for (var k in tbw) {
        writeConf(k);
    }
}