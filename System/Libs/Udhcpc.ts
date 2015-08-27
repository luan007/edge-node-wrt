var utils = require("./Utils");
var child_process = require("child_process");
var cmd = "udhcpc";

export function IsAlive(cb){
    return utils.QueryProcess(cmd, function (err, res){
        return cb(undefined, !!(res && res.length));
    });
}

export function Start(cb) {
    var jobs = [];

    jobs.push(function(cb){
        exec("ifconfig", "br0", "192.168.88.1", function () { cb(); });
    });
    jobs.push(function(cb){
        exec("killall", "udhcpc", function(){ cb(); });
    });
    jobs.push(function(cb){
        var ps = child_process.spawn(cmd, ['-i', SECTION_CONST.DEV.ETH.DEV_WAN], {detached: true});
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
