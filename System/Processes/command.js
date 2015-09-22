var child_process = require("child_process");

module.exports.exec = function (cmd) {
    var args = [].slice.apply(arguments);
    args.shift();
    var cb = typeof (args[args.length - 1]) === "function" ? args.pop() : function () {};
    var j = args.length == 0 ? child_process.exec.bind(null, cmd, {}) : child_process.execFile.bind(null, cmd, args, {});
    j(function(err, stdio, stderr){
        if (err || (stderr && stderr.length > 0)) {
            return cb(err ? err : new Error(stderr.toString()), stdio.toString(), stderr.toString());
        }
        return cb(undefined, stdio.toString(), stderr.toString());
    });
}