var child_process = require("child_process");

export function Start(cb) {
    var jobs = [];

    jobs.push(function(cb){
        exec("ifconfig", "br0", "192.168.88.1", function () { cb(); });
    });
    jobs.push(function(cb){
        exec("killall", "udhcpc", function(){ cb(); });
    });
    jobs.push(function(cb){
        var ps = child_process.spawn("udhcpc", ['-i', SECTION_CONST.DEV.ETH.DEV_WAN], {detached: true});
        ps.stdout.on('data', function (data) {
            console.log("uDhcpc result:", data.toString().cyan);
        });
        ps.stderr.on('data', function (data) {
            console.log('uDhcpc stderr: ' , data.toString().red);
        });
        cb();
    });

    async.series(jobs, cb);
}
