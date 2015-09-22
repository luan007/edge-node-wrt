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
var key = process.argv[4];

var confs = {};
confs["dnsmasq"]    = "/etc/dnsmasq.conf";
confs["hostapd2g"]  = "/etc/hostapd_2g.conf";
confs["hostapd5g"]  = "/etc/hostapd_5g.conf";
var entries = {};
entries["network"]  = "/etc/network.json";
entries["wifi"]     = "/etc/wifi.json";
entries["dhcp"]     = "/etc/dhcp.json";
entries["firewall"] = "/etc/firewall.json";
entries["system"]   = "/etc/system.json";
entries["time"]     = "/etc/time.json";
entries["ssh"]      = "/etc/ssh.json";

var targetConfs = {};
function readConfig(cname) {
    targetConfs[cname] = targetConfs[cname] || {};
    var conf = confs[cname];
    var delimiter = "=";
    var line = "\n";
    var rows = fs.readFileSync(conf).split(line);

    rows.forEach(function (row) {
        var parts = row.split(delimiter);
        var row = parts[0];
        var val = parts[1];
        targetConfs[cname][row] = targetConfs[cname][row] || [];
        targetConfs[cname][row].push(val !== undefined ? row + "=" + val : row);
    });
}
var sourceConfs = {};
function readEntry(entry) {
    sourceConfs[entry] = sourceConfs[entry] || {};
    var delimiter = "=";
    var conf = entries[entry];
    var line = "\n";
    var rows = fs.readFileSync(conf).split(line);

    rows.forEach(function (row) {
        var parts = row.split(delimiter);
        var row = parts[0];
        var val = parts[1];
        sourceConfs[entry][row] = val;
    });
}

if (!entries.hasOwnProperty(entry)) {
    res.result = "illegal entry";
    return output(res);
} else if (entry === "network") {
    readEntry("network");
    readConfig("dnsmasq");
} else if (entry === "wifi") {
    readEntry("wifi");
    readConfig("hostapd2g");
    readConfig("hostapd5g");
}

//TODO: translation
if (command === "get") {
    if (targetConfs[key]) {
        res.success = true;
        res.result = targetConfs[key].length == 1 ? targetConfs[key][0] : targetConfs[key];
        return output(res);
    }
    else {
        res.result = "key not found";
        return output(res);
    }
} else if (command === "set") {
    var keys = [], vals = [];
    for (var i = 3; i < process.argv.length; i++) {
        (i % 2 == 1) ? keys.push(process.argv[i]) : vals.push(process.argv[i]);
    }

    for (var i = 0; i < keys.length; i++) {
        if (vals[i]) {
            if (entry === "network" && keys[i] === "routerip") {
                targetConfs["dnsmasq"]["dhcp-option"] = [
                    "46,8"
                    , "6," + vals[i]
                ];
            }
        }
    }

}