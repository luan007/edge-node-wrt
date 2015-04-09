function SetQuota(options, cb, quota_fs) {
    if (quota_fs === void 0) { quota_fs = "/"; }
    if (options.user || options.group) {
        var queue = intoQueue("SETQUOTA", async.series.bind(null, [
            function (cb) {
                exec("setquota", options.user ? "-u" : "-g", options.user ? options.user : options.group, options.size_soft ? options.size_soft : 0, options.size_hard ? options.size_hard : 0, options.inode_soft ? options.inode_soft : 0, options.inode_hard ? options.inode_hard : 0, quota_fs, ignore_err(cb));
            },
            function (cb) {
                exec("quotaoff", options.user ? "-u" : "-g", quota_fs, ignore_err(cb));
            },
            function (cb) {
                exec("quotaon", options.user ? "-u" : "-g", quota_fs, ignore_err(cb));
            },
        ]), cb);
        trace("SetQuota @ " + queue);
    }
    else {
        return cb(new Error("User/Group is not specified"));
    }
}
exports.SetQuota = SetQuota;
function GetUserLimit(name, cb, quota_fs) {
    if (quota_fs === void 0) { quota_fs = "/"; }
    var sp = parsespawn("repquota", [quota_fs]);
    cb = once(cb);
    sp.on("exit", function () {
        cb();
    });
    sp.on("out_line", function (line) {
        var u = parseLimit(line);
        if (u.user == name)
            return cb(undefined, u);
    });
}
exports.GetUserLimit = GetUserLimit;
function parseLimit(line, is_user) {
    if (is_user === void 0) { is_user = true; }
    try {
        var sp = line.split(/\s+/);
        var result = {
            user: is_user ? sp[0] : undefined,
            group: !is_user ? sp[0] : undefined,
            size_used: Number(sp[2]),
            size_soft: Number(sp[3]),
            size_hard: Number(sp[4]),
            size_grace: Number(sp[5]),
            inode_used: Number(sp[6]),
            inode_soft: Number(sp[7]),
            inode_hard: Number(sp[8]),
            inode_grace: Number(sp[9])
        };
        return result;
    }
    catch (e) {
        return undefined;
    }
}
