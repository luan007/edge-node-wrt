var child_process = require("child_process");

function exec(cmd) {
    var args = [].slice.apply(arguments);
    args.shift();
    var cb = typeof (args[args.length - 1]) === "function" ? args.pop() : function () {
    };
    var j = args.length == 0 ? child_process.exec.bind(null, cmd, {}) : child_process.execFile.bind(null, cmd, args, {});
    console.log("[exec]", cmd + " " + args.toString());
    j(function (err, stdio, stderr) {
        if (err || (stderr && stderr.length > 0)) {
            return cb(err ? err : new Error(stderr.toString()), stdio.toString(), stderr.toString());
        }
        return cb(undefined, stdio.toString(), stderr.toString());
    });
};

module.exports.eci_get = function (entry, key, cb) {
    exec("node", "/ramdisk/System/CI/ECI.js", entry, "get", key, function (err, res) {
        if (err) return cb(err);
        return cb(undefined, res.toString());
    });
};

module.exports.eci_set = function (entry) {
    return exec("node", "/ramdisk/System/CI/ECI.js", entry, "set");
};

function md5_file(fpath) {
    var data = require("fs").readFileSync(fpath);
    return md5_string(data);
};

function md5_string(str) {
    return require('crypto').createHash('md5').update(str).digest('hex');
}

function md5_compare(fpath, str){
    var md5f = md5_file(fpath),
        md5s = md5_string(str);
    console.log("[md5]", fpath, md5f, "string:", md5s);
    return md5f === md5s;
}

module.exports.exec = exec;
module.exports.md5_file = md5_file;
module.exports.md5_string = md5_string;
module.exports.md5_compare = md5_compare;

