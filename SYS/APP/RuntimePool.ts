import Runtime = require("./Runtime");
import fs = require("fs");
import net = require('net');
import PermissionLib = require('../API/Permission');
import _Application = require('../DB/Models/Application');
import Application = _Application.Application;
import IApplication = _Application.IApplication;
import Server = require('../API/Server');
import User = require('../Common/Native/user');
import AppManager = require('./AppManager');
import Tracker = require('./Ports/Tracker');
import Limit =  require('./FileSystem/Limit');
import APIManager = require("../../Modules/RPC/API/APIManager");

//APP_ID : APP_STRUCT
var _pool:IDic<Runtime> = <any>{};
//RUNTIME_ID: APP_ID
var _runtime_map:string[] = <any>{};

var _resp_scanner;

function ResponsivenessScan() {
    var keys = Object.keys(_pool);
    for (var i = 0; i < keys.length; i++) {
        var runtime:Runtime = _pool[keys[i]];
        runtime.UpdateResponsiveness();
    }
}

function ConnectionHandler(credential:{ uid; pid; gid; }, socket:net.Socket, callback:(handled:boolean) => any) {
    trace("RPC Socket Scan (APP) ~ " + credential.pid);
    var keys = Object.keys(_pool);
    for (var i = 0; i < keys.length; i++) {
        var runtime:Runtime = _pool[keys[i]];
        if (runtime.Status().State === 1 &&
            runtime.GetPID() === credential.pid &&
            runtime.RPC === undefined) {
            //GOOD
            trace("Successful Reverse Connection [PID] " + credential.pid);
            trace("Permission Set to APP-PRE-LAUNCH [PID] " + credential.pid);
            PermissionLib.SetPermission(
                runtime.RuntimeId,
                PermissionLib.Encode([
                    Permission.AppPreLaunch
                ])
            );
            //Start serving STUFF
            return Server.Serve(socket, CONF.SENDER_TYPE_APP, runtime.RuntimeId, runtime.RuntimeId, (err, endpoint) => {
                runtime.RPC = endpoint;
                trace("RPC is up [PID] " + credential.pid);
                return callback(true);
            });
        }
    }
    trace("NO MATCH, Moving on.. " + credential.pid);
    callback(undefined);
}

export function LoadApplication(app_uid:string, callback:PCallback<string>) {

    if (!app_uid) return callback(new Error("Invalid Parameter"));
    if (_pool[app_uid] && !_pool[app_uid].IsRunning()) {
        trace("App is loaded, Starting " + app_uid);
        StartRuntime(app_uid);
        return callback(undefined, (<Runtime>_pool[app_uid]).RuntimeId);
    } else if (_pool[app_uid]) {
        return callback(undefined, (<Runtime>_pool[app_uid]).RuntimeId);
    }
    AppManager.GetOneByUID(app_uid, (err, result) => {
        trace("Loading App.. " + app_uid);
        if (err) {
            return callback(err, undefined);
        }
        var id = UUIDstr();
        var runtime:Runtime;
        try {
            runtime = new Runtime(id, result);
        } catch (e) {
            error("Runtime Load Failed! Bad Man-fest maybe?");
            error(e);
            return callback(e, id);
        }
        _pool[result.uid] = runtime;
        _runtime_map[id] = result.uid;
        StartRuntime(app_uid);
        return callback(undefined, id);
    });
}

export function UnloadApplication(app_uid:string, callback:Callback) {
    if (has(_pool, app_uid)) {
        _pool[app_uid].SafeQuit();
        delete _runtime_map[_pool[app_uid].RuntimeId];
        delete _pool[app_uid];
    }
    process.nextTick(callback);
}

export function GetPooledApps(callback) {
    var keys = Object.keys(_pool);
    var results = [];
    for (var i = 0; i < keys.length; i++) {
        results.push(GetSnapshot(_pool[keys[i]]));
    }
    callback(undefined, results);
}

function _clean_up(runtimeId, cb) {
    trace("Cleaning Up..");

    var runtime = GetAppByRID(runtimeId);
    if (runtime) {
        Tracker.ReleaseByOwner(runtimeId, (err, result) => {
            if (err) warn(err);
            umount_till_err(AppManager.GetAppDataLn(runtime.App.uid), (err, result) => {
                try {
                    if (fs.existsSync(AppManager.GetAppDataLn(runtime.App.uid))) {
                        fs.rmdirSync(AppManager.GetAppDataLn(runtime.App.uid)); //that's it..
                    }
                } catch (e) {
                    warn("Failed to remove AppData Folder, but that's possibly OK");
                }
                try {
                    if (fs.existsSync(runtime.MainSock())) {
                        fs.rmdirSync(runtime.MainSock()); //that's it..
                    }
                } catch (e) {
                    warn("Failed to remove MainSocket, but that's possibly OK");
                }
                try {
                    if (fs.existsSync(runtime.WebExSock())) {
                        fs.rmdirSync(runtime.WebExSock()); //that's it..
                    }
                } catch (e) {
                    warn("Failed to remove WebSocket, but that's possibly OK");
                }
                return cb();
            });
        });
    }
    else cb();
};
function _check(target_dir, api_salt, cb) {
    if (CONF.IS_DEBUG && CONF.BYPASS_APP_SIGCHECK) {
        warn("!!Sigcheck Bypassed!!");
        return cb(undefined, true);
    }
    try {
        var salt = new Buffer(api_salt, "hex");
        var hash = HashDir(target_dir, salt);
        var snapshot = salt.toString("hex") + hash.toString("hex");
        return cb(undefined, RSA_Verify("App", api_salt, snapshot));
    } catch (e) {
        return cb(e, false);
    }
};
function _ensure_user(runtimeId, cb) {
    var runtime = GetAppByRID(runtimeId);
    if (runtime) {
        User.Get(runtimeId, (err, user) => {
            if (err) {
                return cb(err, undefined);
            }
            if (!user) {
                trace("Creating User for Runtime .." + runtime.App.name.bold);
                User.Create(
                    runtimeId,
                    "nogroup",
                    undefined,
                    (err, result) => {
                        if (err) {
                            return (new Error("Cannot Create User"), undefined);
                        }
                        User.Get(runtimeId, (err, user) => {
                            if (err) {
                                return (new Error("Cannot Create User"), undefined);
                            }
                            runtime.UserId = user.userId;
                            trace("User Created");
                            return cb(undefined, runtime.UserId);
                        });
                    });
            }
            else {
                runtime.UserId = user.userId;
                return cb(undefined, user.userId);
            }
        });
    }
};
function _setup_quota (runtimeId, cb) {
    quota(runtimeId, (err, quota) => {
        if (err) return cb(err);
        quota(runtimeId, cb, quota);
    });
};
function quota(runtimeId, cb, newval?) {
    var runtime = GetAppByRID(runtimeId);
    if (newval == undefined) {
        runtime.Registry.get("QUOTA",
            ignore_err(withdefault(cb, CONF.ISO_DEFAULT_LIMIT)));
    } else {
        Limit.SetQuota({
            user: runtimeId,
            inode_hard: 0,
            inode_soft: 0,
            size_hard: newval,
            size_soft: newval
        }, (err) => {
            if (err) {
                return cb(err);
            } else {
                runtime.Registry.put("QUOTA", newval, cb);
            }
        });
    }
};
function quata_usage(runtimeId, cb){
    var runtime = GetAppByRID(runtimeId);
    if (!runtime.IsRunning()) {
        return cb(new Error("Not Running"));
    }
    Limit.GetUserLimit(runtimeId, cb);
}
function StartRuntime(app_uid) {
    var runtime = _pool[app_uid];
    if (runtime) {
        async.series([
            _clean_up.bind(null, runtime.RuntimeId),
            (cb) => {
                _check(AppManager.GetAppRootPath(runtime.App.uid), runtime.App.appsig.substr(0, 512), (err, result) => {
                    if (err || !result) {
                        runtime.Broken();
                    }
                    cb(err, result);
                });
            },
            _ensure_user.bind(null, runtime.RuntimeId),
            (cb) => {
                if (CONF.CODE_WRITE_LOCK) {
                    AppManager.SetOwner_Recursive(AppManager.GetAppRootPath(runtime.App.uid), runtime.RuntimeId, cb);
                } else {
                    return cb();
                }
            },
            (cb) => {
                AppManager.SetupAppDataDir(runtime.App.uid, runtime.RuntimeId,
                    (err, p) => {
                        if (err) {
                            error(err);
                            runtime.Broken();
                            return cb(err, undefined);
                        }
                        return cb(undefined);
                    });
            },
            _setup_quota.bind(null, runtime.RuntimeId),
            (cb:Callback) => {
                fs.mkdir(AppManager.GetAppDataLn(runtime.App.uid), <any>ignore_err(cb));
            },
            mount_auto.bind(null, path, AppManager.GetAppDataLn(runtime.App.uid), ["--bind"]),
            exec.bind(null, "chown", "root", AppManager.GetAppRootPath(runtime.App.uid)),
            exec.bind(null, "chmod", "0755", AppManager.GetAppRootPath(runtime.App.uid)),
            exec.bind(null, "chown", runtime.RuntimeId, AppManager.GetAppDataLn(runtime.App.uid)),
            exec.bind(null, "chmod", "-R", "0755", AppManager.GetAppDataLn(runtime.App.uid)) //TODO: FIX THIS CHMOD 711 -> 701
        ], (e, r) => {
            if (e) {
                error(e);
                return runtime.ForceError(e);
            }
            runtime.Start();
        });
    }
}

export function GetSnapshot(runtime:Runtime) {
    var _strip = Application.Strip(runtime.App);
    var _status = runtime.Status();

    var _snapshot = {
        Id: _strip.uid,
        App: _strip,
        Status: _status
    };
    info(" * Snap * " + JSON.stringify(_snapshot));
    return _snapshot;
};

export function GetLauncher() {
    return _pool[CONF.CORE_PARTS["LAUNCHER"]];
}

export function GetAppByRID(runtimeId):Runtime {
    if (_runtime_map[runtimeId]) {
        return _pool[_runtime_map[runtimeId]];
    }
}

export function GetAppByAppId(appId):Runtime {
    return _pool[appId];
}

export function GetCallingRuntime(context):Runtime {
    if (SenderType(context) !== CONF.SENDER_TYPE_APP ||
        SenderId(context) === undefined) {
        return undefined;
    } else {
        return _pool[_runtime_map[SenderId(context)]];
    }
}

export function Initialize(cb) {
    trace("Initializing..");

    Server.AddHandler(ConnectionHandler);

    trace("App Resp Scan Probe at " + ('' + CONF.APP_RESP_SCAN_INTERVAL.toString()).bold);
    _resp_scanner = setInterval(ResponsivenessScan, CONF.APP_RESP_SCAN_INTERVAL);

    SYS_ON(SYS_EVENT_TYPE.LOADED, function () {
        trace("Clearing Runtime-User Cache");
        User.ClearGenerated((err, result) => {
            if (err) {
                return error("Oops, " + err);
            }

            //AUTO LOAD INSTALLED APPS
            if (!CONF.AUTO_LOAD_APPS) {
                return; //SKIPPED
            }

            trace("Autoloading All Apps, Implementation is a total mess, fix this !!");
            //TODO: FIX THIS (LoadApp ( dupe ))
            AppManager.GetAllApplications((err, results) => {
                if (err) {
                    return error(err);
                } else {
                    for (var i = 0; i < results.length; i++) {
                        LoadApplication(results[i].uid, () => { /*SWALLOW*/
                        });
                    }
                }
            });

        });

    });

    cb();
}

export function GetQuota(appid, callback) {
    var runtime = GetAppByAppId(appid);
    if (!runtime) {
        callback(new Error("App not found"));
    } else {
        quata_usage(runtime.RuntimeId, callback);
    }
}

export function SetQuota(appid, target, callback) {
    var runtime = GetAppByAppId(appid);
    if (!runtime) {
        callback(new Error("App not found"));
    } else {
        runtime.Quota(callback, target);
    }
}

function _GetQuota(callback) {
    var runtime = GetCallingRuntime(this);
    if (!runtime || !runtime.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        runtime && runtime.ForceError(err.message);
        return callback(err, undefined);
    }
    quata_usage(runtime.RuntimeId, callback);
}

function _RaiseQuota(delta, callback) {
    var curPackage = GetCallingRuntime(this);
    if (!curPackage || !curPackage.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        curPackage && curPackage.ForceError(err.message);
        return callback(err, undefined);
    }
    curPackage.Quota((err, old) => {
        if (err) {
            return callback(err, undefined);
        } else {
            //DO THOSE STUFF
            return callback(new Error("Not Implemented!  :("));
        }
    });
}

function _SetupReverseAPI(api, callback) {
    var curPackage:Runtime = GetCallingRuntime(this);
    //
    if (!curPackage || !curPackage.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        curPackage && curPackage.ForceError(err.message);
        return callback(err, undefined);
    }

    if (!api) {
        curPackage.ForceError("Corrupt Reverse API");
        return callback(new Error("Corrupt API :("));
    }
    var real = APIManager.GetAPI(api, curPackage.RPC);
    //NICE
    //return callback(undefined, true);

    /**UPDATE PERMISSION**/
    try {
        info("Elevating Permission ~ " + curPackage.App.uid.bold);
        //Trusted?

        //TODO: ADD trust splitter here

        //var trimmed: string = curPackage.Manifest.permission; //FIX THIS

        ////value are sepped with & then saved
        ////(HEX[14930&1843102393&849104] HEX[256byte salt]) ->>> sign
        //var data = trimmed.split("&");
        //var perm = new Array(data.length);
        //for (var i = 0; i < data.length; i++) {
        //    perm[i] = Number(data[i]);
        //}
        //PermissionLib.SetPermission(SenderId(this), perm);
        //info("Permission set! " + GetCallingRuntime(this).App.uid.bold);
        //info(JSON.stringify(PermissionLib.Decode(perm)));

        var perm = curPackage.Manifest.permission;
        PermissionLib.SetPermission(SenderId(this), perm);
        info("Permission set! " + curPackage.App.name.bold);
        info(JSON.stringify(
                PermissionLib.DecodeToString(
                    PermissionLib.GetPermission(SenderId(this))))
        );
        curPackage.AfterLaunch(real);
        return callback(undefined, true);

    } catch (e) {
        error("Error elevating permission, might be dangerous, killing " + (curPackage.GetPID() + "").bold);
        error(e);
        return curPackage.ForceError(e);
    }

}

(__API(_SetupReverseAPI, "Sandbox.SetupReverseAPI", [Permission.AppPreLaunch]));
(__API(_GetQuota, "IO.Quota.Stat", [Permission.AnyApp, Permission.IO]));
(__API(_RaiseQuota, "IO.Quota.Raise", [Permission.AnyApp, Permission.IO]));

(__API(GetQuota, "App.Manager.GetQuota", [Permission.AppCrossTalk]));
(__API(SetQuota, "App.Manager.SetQuota", [Permission.System]));
(__API(LoadApplication, "App.Manager.Load", [Permission.System]));
(__API(GetPooledApps, "App.Manager.List", [Permission.AppCrossTalk]));