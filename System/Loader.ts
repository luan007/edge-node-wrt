require("../SYS/Env");
require("./CI/SectionConst");

process.on('uncaughtException', function (err) {
    fatal(err);
    fatal(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    fatal(err);
    fatal(err.stack);
});

domain.run(function () {
    var Udhcpc = require("./Handlers/Udhcpc");
    var Dnsmasq = require("./Handlers/Dnsmasq");
    var Hostapd = require("./Handlers/Hostapd");

    var jobs = [];

    jobs.push(function(cb){
        Udhcpc.Start(cb);
    });
    jobs.push(function(cb){
        Hostapd.Config2G(cb);
    });
    //jobs.push(function(cb){
    //    Hostapd.Config5G(cb);
    //});
    jobs.push(function(cb){
        Dnsmasq.Config(cb);
    });

    async.series(jobs, function() {
        console.log("ALL LOADED...".green);
    });
});