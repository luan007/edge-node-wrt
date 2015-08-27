require("../SYS/Env");
require("./CI/SectionConst");
var child_process = require("child_process");

process.on('uncaughtException', function (err) {
    fatal(err);
    fatal(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    fatal(err);
    fatal(err.stack);
});

var errHandler = function(err) { if(err) console.log(err.red); };

domain.run(function () {
    var jobs = [];
    var Udhcpc = require("./Libs/Udhcpc");
    var Dnsmasq = require("./Libs/Dnsmasq");
    var Hostapd = require("./Libs/Hostapd");

    jobs.push(function(cb){
        Udhcpc.Start(cb);
    });
    jobs.push(function(cb){
        Hostapd.GenerateConfig2G(cb);
    });
    jobs.push(function(cb){
        Dnsmasq.GenerateConfig(cb);
    });

    async.series(jobs, function() {
        console.log("ALL LOADED...".green);

        setInterval(function() {
            Dnsmasq.IsAlive(function(err, res) {
                if(res === false) {
                    Dnsmasq.Start();
                } else {
                    Dnsmasq.Fetch(errHandler);
                }
            });

            Hostapd.IsAlive2G(function(err, res){
                if(res === false) {
                    Hostapd.Start2G();
                } else {
                    Hostapd.Fetch2G(errHandler);
                }
            });
        }, 1000);
    });
});