var child_process = require("child_process");

module.exports.queryProcess = function(name, cb) {
    var cmd = "ps ax | grep '" + name + "' | grep -v grep";
    console.log("queryProcess", cmd);
    child_process.exec(cmd, function (error, stdout) {
        if (error) return cb(error);
        if (stdout) {
            var parts = stdout.split("\t");
            return cb(undefined, {pid: parts[0]});
        } else
            return cb();
    });
}