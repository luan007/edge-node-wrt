require("./Env");

var child_process = require("child_process");

process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    console.log(err);
    console.log(err.stack);
});

var errHandler = function(err) { if(err) console.log(err.red); };

domain.run(function () {
    var jobs = [];

    jobs.push(function(cb){//Register ALL
        Agency.Register(SECTION_CONST.AGENT.DNSMASQ, SECTION_CONST.AGENT.EVENTS.NEW, WifiBus.OnLease);
        Agency.Register(SECTION_CONST.AGENT.DNSMASQ, SECTION_CONST.AGENT.EVENTS.DEL, WifiBus.DropLease);
        Agency.Register(SECTION_CONST.AGENT.HOSTAPD, SECTION_CONST.AGENT.EVENTS.NEW, WifiBus.OnStation);
        Agency.Register(SECTION_CONST.AGENT.HOSTAPD, SECTION_CONST.AGENT.EVENTS.DEL, WifiBus.DropStation);
        cb();
    });
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
            Udhcpc.IsAlive(function(err, res) {
                if(res === false) {
                    Udhcpc.Start(function(){});
                }
            });

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