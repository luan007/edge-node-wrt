require('../SYS/Env');

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
    var ctrl_dnsmasq = require('./handlers/ctrl_dnsmasq');
    var ctrl_hostapd = require('./handlers/ctrl_hostapd');

    var jobs = [];

    jobs.push(function(cb){
        console.log("DNSMASQ > WRITE CONF");
        ctrl_dnsmasq.Config(cb);
    });
    jobs.push(function(cb){
        console.log("HOSTAPD > WRITE 2G CONF");
        ctrl_hostapd.Config2G(cb);
    });
    //jobs.push(function(cb){
    //    console.log("HOSTAPD > WRITE 5G CONF");
    //    ctrl_hostapd.Config5G(cb);
    //});

    jobs.push(function(cb){
        console.log("DNSMASQ > START");
        ctrl_dnsmasq.Start(cb);
    });

    jobs.push(function(cb){
        console.log("HOSTAPD > START 2G");
        ctrl_hostapd.Start2G(cb);
    });

    async.series(jobs, function() {
        console.log("ALL LOADED...".green);
    })
});