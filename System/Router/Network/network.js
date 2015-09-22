var async = require("async");
var path = require("path");
var Daemon = require("../../Processes/daemon");
var exec = require("../../Processes/command").exec;

var dnsmasq = new Daemon("dnsmasq", ["-k"]);
var hostapd2g = new Daemon("hostapd", ["/etc/hostapd_2g.conf"]);
var udhcpc = undefined;
var pppd = undefined;
var eciPath = "/ramdisk/System/CI/ECI.js";

var jobs = [];
jobs.push(function (cb) {
    exec("node", eciPath, "network", "get", "wan", function (err, res) {
        if (err) return console.log("error:", err);

        try {
            var json = JSON.parse(res.toString());
            if (json.success === true) {
                if (json.result.scheme === "uchcpc") {
                    udhcpc = new Daemon("udhcpc", ['-i', json.result.up_interface, '-f']);
                    udhcpc.start();
                } else {
                    //var secrets = json.result.ppp.account + "\t*\t" + json.result.ppp.passwd;
                    //fs.writeFileSync("/etc/ppp/pap-secrets", secrets, "\w");
                    pppd = new Daemon("pppd", ['unit', json.result.ppp.number, "plugin", "/usr/lib/pppd/2.4.7/rp-pppoe.so", "nodetach"]);
                    pppd.start();
                }
            }
        } catch (e) {
        }
        cb();
    });
});

jobs.push(function (cb) {
    dnsmasq.start();
    cb();
});

jobs.push(function (cb) {
    hostapd2g.start();
    cb();
});

module.exports.Initialize = function (cb) {
    console.log("nint")

    async.series(jobs, function (err) {
        if (err) console.log(err)
        cb();
    });
}