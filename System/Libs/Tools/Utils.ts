var child_process = require("child_process");

export function QueryProcess(name, cb) {
    var cmd = "ps ax | grep '" + name + "' | grep -v grep";
    //console.log("queryProcess", cmd);
    var ps = child_process.exec(cmd, function (error, stdout) {
        //console.log(arguments);
        if (error) {
            ps.kill();
            return cb(error);
        }
        if (stdout) {
            ps.kill();
            var res = [];
            var rows = stdout.trim("\n").split("\n");
            for(var i in rows) {
                res[i] = {pid: rows[i].trim(/\s+/gmi).split(/\s+/gmi)[0]};
            }
            return cb(undefined, res);
        } else {
            ps.kill();
            return cb();
        }
    });
}