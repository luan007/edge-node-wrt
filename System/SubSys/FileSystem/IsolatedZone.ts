import Core = require("Core");
import Node = require("Node");

export function Initialize(cb) {
    //Check if the folder exists..
    trace("Init..");
    //TODO: GET THIS FIXED
    //EdgeFS.Init(process.env.GUARD_PATH);
    if (!Node.fs.existsSync(CONF.SHADOW_BASE_PATH)) {
        info("Creating Shadow Root_Path..");
        Node.fs.mkdirSync(CONF.SHADOW_BASE_PATH);
    }

    if (!Node.fs.existsSync(CONF.BASE_DATA_PATH)) {
        info("Creating Shadow Data_Path..");
        Node.fs.mkdirSync(CONF.BASE_DATA_PATH);
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
    // useless
    // trace("If crashed here, the system is then somehow broken and shall not start.");

    if (!CONF.ROOT_LEVEL_SECURITY && CONF.IS_DEBUG) {
        fatal("ROOT LEVEL SECURITY IS OFF");
        error("YOU ARE RUNNING WITHOUT PROTECTION");
        //error("SET ROOT_LEVEL_SECURITY TO OFF IS A MUST".bold.red);
    }
    if (!CONF.CODE_WRITE_LOCK && CONF.IS_DEBUG) {
        fatal("CODE-WRITE-LOCK IS OFF");
        error("MODIFICATION IS ALLOWED");
        //error("SET ROOT_LEVEL_SECURITY TO OFF IS A MUST".bold.red);
    }

    //TODO: Fix CHMOD, 0711 is not secure
    //error("FIX CHMOD !! 711 IS NOT SECURE!!!!!!!!");
    
    async.series([
        exec.bind(null, "quotaoff", "-a"),
        (CONF.IS_DEBUG && !CONF.ROOT_LEVEL_SECURITY) ? (cb) => { cb(); } : exec.bind(null, "chmod", "005", "/"),
        (CONF.IS_DEBUG && !CONF.ROOT_LEVEL_SECURITY) ? (cb) => { cb(); } : exec.bind(null, "chmod", "005", "/bin"),
        (CONF.IS_DEBUG && !CONF.ROOT_LEVEL_SECURITY) ? (cb) => { cb(); } : exec.bind(null, "chmod", "005", "/usr"),
        //exec.bind(null, "chmod", "000", SHADOW_BASE_PATH),
        exec.bind(null, "chown", "root", "-R", CONF.SHADOW_DATA_PATH),
        exec.bind(null, "chmod", "711", CONF.SHADOW_DATA_PATH), //TODO: USE GROUP!!! 711 VS 701
        (CONF.IS_DEBUG && !CONF.CODE_WRITE_LOCK) ? (cb) => { cb(); } : exec.bind(null, "chmod", "500", "-R", Node.path.join(CONF.BASE_PATH + "../")),
        (c) => {
            exec("umount", "-l", "-f", CONF.SHADOW_BASE_PATH, (err) => {
                if (err) warn(err);
                c();
            });
        },
        exec.bind(null, "mount",
            "-o", "remount,rw,usrquota,grpquota",
            "/"),
        exec.bind(null, "mount",
            "-o", "noexec,nodev,nosuid,rw,usrquota,grpquota",
            CONF.DEV_STORAGE,
            CONF.SHADOW_BASE_PATH),
        (c) => {
            try {
                if (Node.fs.existsSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.group"))) {
                    Node.fs.unlinkSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.group"));
                }
                if (Node.fs.existsSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.user"))) {
                    Node.fs.unlinkSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.user"));
                }
                return c();
            } catch (e) {
                return c(e);
            }
        },
        (c) => {
            fatal("QUOTACHECK.. This may take some time..");
            c();
        },
        (c) => {
            if (!(CONF.SKIP_QUOTA_CHECK && CONF.IS_DEBUG)) {
                exec("quotacheck", "-ugcfm", CONF.SHADOW_BASE_PATH,(err) => {
                    if (Node.fs.existsSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.group"))
                        &&
                        Node.fs.existsSync(Node.path.join(CONF.SHADOW_BASE_PATH, "aquota.user"))) {
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
            } else {
                error("SKIPPING QUOTA CHECK");
                error("Seriously, enable this if you don't like crashes");
                c();
            }
        },
        (c) => {
            info("So far so good :p");
            c();
        }
    ], cb);
}

export function GetSPath(pth) {
    return Node.path.join(CONF.SHADOW_BASE_PATH, pth);
}

export function GetSDataPath(pth) {
    return Node.path.join(CONF.SHADOW_DATA_PATH, pth);
}

export function SetOwner_Recursive(folder, owner, cb) {
    exec("chown", "-R", owner, folder, cb);
}

export function SetupAppDataDir(app_id, runtime_id, cb) {

    var path = GetAppDataDir(app_id);

    var done = (err, result) => {
        cb(err, path);
    };
    error("CHMOD 711 IS NOT SECURE!!!!!!");
    if (Node.fs.exists(path, (exist) => {
        if (!exist) {
            Node.fs.mkdir(path, (err) => {
                if (err) return done(err, path);
                exec("chmod", "-R", "0711", path, (err) => { //TODO: FIX THIS CHMOD 711 -> 701
                    if (err) return done(err, path);
                    SetOwner_Recursive(path, runtime_id, done);
                });
            });
        } else {
            exec("chmod", "-R", "0711", path, (err) => { //TODO: FIX THIS CHMOD 711 -> 701
                if (err) return done(err, path);
                SetOwner_Recursive(path, runtime_id, done);
            });
        }
    }));

}

export function GetAppDataDir(app_id) {
    return GetSDataPath("App/" + app_id);
}

export function GetRealAppDataDir(app_id) {
    return Node.path.join(CONF.BASE_DATA_PATH, "App/" + app_id);
}