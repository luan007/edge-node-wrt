var child_process = require("child_process");

export function Start(cb) {
    var ps = child_process.spawn("udhcpc", ['-i', SECTION_CONST.DEV.ETH.DEV_WAN], {detached: true});
    ps.stdout.on('data', function (data) {
        console.log(data.toString().cyan);
    });
    ps.stderr.on('data', function (data) {
        console.log('ps stderr: ' + data.toString().red);
    });
    cb();
}
