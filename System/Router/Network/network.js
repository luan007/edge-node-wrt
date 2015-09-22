//var async = require("async");
var Daemon = require("../../Processes/daemon");
var exec = require("../../Processes/command").exec;

var dnsmasq = new Daemon("dnsmasq", ["-k"]);
var hostapd2g = new Daemon("hostapd", ["/etc/hostapd_2g.conf"]);

exec("node /ramdisk/System/CI/ECI network get wan", function(err, res){
    if(err) return console.log("error:", err);

    console.log(res);
});