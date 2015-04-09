var Node = require("Node");
function Initialize(cb) {
    trace("Init..");
    if (!Node.fs.existsSync(CONF.SHADOW_BASE_PATH)) {
        info("Creating Shadow Root_Path..");
        Node.fs.mkdirSync(CONF.SHADOW_BASE_PATH);
    }
    if (!Node.fs.existsSync(CONF.SHADOW_DATA_PATH)) {
        info("Creating Shadow Data_Path..");
        Node.fs.mkdirSync(CONF.SHADOW_DATA_PATH);
    }
    if (!Node.fs.existsSync(CONF.SHADOW_BASE_PATH)) {
        info("Creating Shadow Data_Path..");
        Node.fs.mkdirSync(CONF.SHADOW_BASE_PATH);
    }
    if (!Node.fs.existsSync(GetSDataPath("App"))) {
        info("Creating API Storage..");
        Node.fs.mkdirSync(GetSDataPath("App"));
    }
    trace("Preparing FS..");
    if (!CONF.ROOT_LEVEL_SECURITY && CONF.IS_DEBUG) {
        fatal("ROOT LEVEL SECURITY IS OFF");
        error("YOU ARE RUNNING WITHOUT PROTECTION");
    }
    if (!CONF.CODE_WRITE_LOCK && CONF.IS_DEBUG) {
        fatal("CODE-WRITE-LOCK IS OFF");
        error("MODIFICATION IS ALLOWED");
    }
    async.series([
        function (cb) {
            Node.fs.link(CONF.DEV_STORAGE, "/dev/root", ignore_err(cb));
        },
        function (cb) {
            exec("quotaoff", "-a", ignore_err(cb));
        },
        (CONF.IS_DEBUG && !CONF.ROOT_LEVEL_SECURITY) ? function (cb) {
            cb();
        } : exec.bind(null, "chmod", "005", "/"),
        (CONF.IS_DEBUG && !CONF.ROOT_LEVEL_SECURITY) ? function (cb) {
            cb();
        } : exec.bind(null, "chmod", "005", "/bin"),
        (CONF.IS_DEBUG && !CONF.ROOT_LEVEL_SECURITY) ? function (cb) {
            cb();
        } : exec.bind(null, "chmod", "005", "/usr"),
        exec.bind(null, "chown", "root", "-R", CONF.SHADOW_DATA_PATH),
        exec.bind(null, "chmod", "711", "-R", CONF.SHADOW_DATA_PATH),
        (CONF.IS_DEBUG && !CONF.CODE_WRITE_LOCK) ? function (cb) {
            cb();
        } : exec.bind(null, "chmod", "500", "-R", Node.path.join(CONF.BASE_PATH + "../")),
        function (c) {
            exec("umount", "-l", "-f", CONF.SHADOW_BASE_PATH, function (err) {
                if (err)
                    warn(err);
                c();
            });
        },
        exec.bind(null, "mount", "-o", "remount,rw,usrquota,grpquota", "/"),
        exec.bind(null, "mount", "-o", "noexec,nodev,nosuid,rw,usrquota,grpquota", CONF.DEV_STORAGE, CONF.SHADOW_BASE_PATH),
        function (c) {
            try {
                if (Node.fs.existsSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.group"))) {
                    Node.fs.unlinkSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.group"));
                }
                if (Node.fs.existsSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.user"))) {
                    Node.fs.unlinkSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.user"));
                }
                return c();
            }
            catch (e) {
                return c(e);
            }
        },
        function (c) {
            fatal("QUOTACHECK.. This may take a while..");
            c();
        },
        function (c) {
            if (!(CONF.SKIP_QUOTA_CHECK && CONF.IS_DEBUG)) {
                exec("quotacheck", "-ugcfm", CONF.SHADOW_BASE_PATH, function (err) {
                    if (Node.fs.existsSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.group")) && Node.fs.existsSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.user"))) {
                        if (err) {
                            warn(err.message);
                        }
                        fatal("Quota Generated!");
                        c();
                    }
                    else {
                        c(err);
                    }
                });
            }
            else {
                error("SKIPPING QUOTA CHECK");
                error("Seriously, enable this if you don't like crashes");
                c();
            }
        },
        function (c) {
            info("So far so good :p");
            c();
        }
    ], cb);
}
exports.Initialize = Initialize;
function GetSPath(pth) {
    return Node.path.join(CONF.SHADOW_BASE_PATH, pth);
}
exports.GetSPath = GetSPath;
function GetSDataPath(pth) {
    return Node.path.join(CONF.SHADOW_DATA_PATH, pth);
}
exports.GetSDataPath = GetSDataPath;
function SetOwner_Recursive(folder, owner, cb) {
    exec("chown", "-R", owner, folder, cb);
}
exports.SetOwner_Recursive = SetOwner_Recursive;
function SetupAppDataDir(app_id, runtime_id, cb) {
    var path = GetAppDataDir(app_id);
    var done = function (err, result) {
        cb(err, path);
    };
    error("CHMOD 711 IS NOT SECURE!!!!!!");
    if (Node.fs.exists(path, function (exist) {
        if (!exist) {
            Node.fs.mkdir(path, function (err) {
                if (err)
                    return done(err, path);
                exec("chmod", "-R", "0711", path, function (err) {
                    if (err)
                        return done(err, path);
                    SetOwner_Recursive(path, runtime_id, done);
                });
            });
        }
        else {
            exec("chmod", "-R", "0711", path, function (err) {
                if (err)
                    return done(err, path);
                SetOwner_Recursive(path, runtime_id, done);
            });
        }
    }))
        ;
}
exports.SetupAppDataDir = SetupAppDataDir;
function GetAppDataDir(app_id) {
    return GetSDataPath("App/" + app_id);
}
exports.GetAppDataDir = GetAppDataDir;
function GetRealAppDataDir(app_id) {
    return Node.path.join(CONF.BASE_DATA_PATH, "App/" + app_id);
}
exports.GetRealAppDataDir = GetRealAppDataDir;
