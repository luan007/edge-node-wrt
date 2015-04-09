var Core = require("Core");
var Runtime = require("./Runtime");
var fs = require("fs");
var _pool = {};
var _runtime_map = {};
var _resp_scanner;
function ResponsivenessScan() {
    var keys = Object.keys(_pool);
    for (var i = 0; i < keys.length; i++) {
        var runtime = _pool[keys[i]];
        runtime.UpdateResponsiveness();
    }
}
function ConnectionHandler(credential, socket, callback) {
    trace("RPC Socket Scan (APP) ~ " + credential.pid);
    var keys = Object.keys(_pool);
    for (var i = 0; i < keys.length; i++) {
        var runtime = _pool[keys[i]];
        if (runtime.Status().State === 1 && runtime.GetPID() === credential.pid && runtime.RPC === undefined) {
            trace("Successful Reverse Connection [PID] " + credential.pid);
            trace("Permission Set to APP-PRE-LAUNCH [PID] " + credential.pid);
            Core.API.Permission.SetPermission(runtime.RuntimeId, Core.API.Permission.Encode([
                9 /* AppPreLaunch */
            ]));
            return Core.API.Server.Serve(socket, CONF.SENDER_TYPE_APP, runtime.RuntimeId, runtime.RuntimeId, function (err, endpoint) {
                runtime.RPC = endpoint;
                trace("RPC is up [PID] " + credential.pid);
                return callback(true);
            });
        }
    }
    trace("NO MATCH, Moving on.. " + credential.pid);
    callback(undefined);
}
function LoadApplication(app_uid, callback) {
    if (!app_uid)
        return callback(new Error("Invalid Parameter"));
    if (_pool[app_uid] && !_pool[app_uid].IsRunning()) {
        trace("App is loaded, Starting " + app_uid);
        _pool[app_uid].Start();
        return callback(undefined, _pool[app_uid].RuntimeId);
    }
    else if (_pool[app_uid]) {
        return callback(undefined, _pool[app_uid].RuntimeId);
    }
    Core.Data.Application.table().one({ uid: app_uid }, function (err, result) {
        trace("Loading App.. " + app_uid);
        if (err) {
            return callback(err, undefined);
        }
        var id = UUIDstr();
        var runtime;
        try {
            runtime = new Runtime(id, result);
        }
        catch (e) {
            error("Runtime Load Failed! Bad Man-fest maybe?");
            error(e);
            return callback(e, id);
        }
        _pool[result.uid] = runtime;
        _runtime_map[id] = result.uid;
        runtime.Start();
        return callback(undefined, id);
    });
}
exports.LoadApplication = LoadApplication;
function UnloadApplication(app_uid, callback) {
    if (has(_pool, app_uid)) {
        _pool[app_uid].SafeQuit();
        delete _runtime_map[_pool[app_uid].RuntimeId];
        delete _pool[app_uid];
    }
    process.nextTick(callback);
}
exports.UnloadApplication = UnloadApplication;
function Install(app_uid, manifest, appsig, callback) {
    trace("Installing " + app_uid);
    trace(manifest);
    Core.Data.Application.table().one({ uid: app_uid }, function (err, result) {
        var upgrade = false;
        var data = {};
        if (!err && result) {
            upgrade = true;
        }
        data.appsig = appsig;
        data.name = manifest.name;
        data.uid = app_uid;
        data.urlName = manifest.name;
        if (upgrade) {
            info("Upgrading " + app_uid);
            result.save(data, callback);
        }
        else {
            info("Saving " + app_uid);
            Core.Data.Application.table().create(data, callback);
        }
    });
}
exports.Install = Install;
function GetPooledApps(callback) {
    var keys = Object.keys(_pool);
    var results = [];
    for (var i = 0; i < keys.length; i++) {
        results.push(_pool[keys[i]].GetSnapshot());
    }
    callback(undefined, results);
}
exports.GetPooledApps = GetPooledApps;
function GetInstalledApps(callback) {
    Core.Data.Application.table().all({}, function (err, results) {
        if (err)
            return callback(err, void 0);
        else {
            return callback(void 0, results);
        }
    });
}
exports.GetInstalledApps = GetInstalledApps;
function GetLauncher() {
    return _pool[CONF.CORE_PARTS["LAUNCHER"]];
}
exports.GetLauncher = GetLauncher;
function GetAppByRID(runtimeId) {
    if (_runtime_map[runtimeId]) {
        return _pool[_runtime_map[runtimeId]];
    }
}
exports.GetAppByRID = GetAppByRID;
function GetAppByAppId(appId) {
    return _pool[appId];
}
exports.GetAppByAppId = GetAppByAppId;
function GetCallingRuntime(context) {
    if (SenderType(context) !== CONF.SENDER_TYPE_APP || SenderId(context) === undefined) {
        return undefined;
    }
    else {
        return _pool[_runtime_map[SenderId(context)]];
    }
}
exports.GetCallingRuntime = GetCallingRuntime;
function Initialize() {
    trace("Initializing..");
    Core.API.Server.AddHandler(ConnectionHandler);
    trace("App Resp Scan Probe at " + ('' + CONF.APP_RESP_SCAN_INTERVAL.toString()).bold);
    _resp_scanner = setInterval(ResponsivenessScan, CONF.APP_RESP_SCAN_INTERVAL);
    SYS_ON(0 /* LOADED */, function () {
        trace("Clearing Runtime-User Cache");
        Core.SubSys.Native.user.ClearGenerated(function (err, result) {
            if (err) {
                return error("Oops, " + err);
            }
            if (!CONF.AUTO_LOAD_APPS) {
                return;
            }
            trace("Autoloading All Apps, Implementation is a total mess, fix this !!");
            Core.Data.Tables.Application().all({}, function (err, results) {
                if (err) {
                    return error(err);
                }
                else {
                    for (var i = 0; i < results.length; i++) {
                        LoadApplication(results[i].uid, function () {
                        });
                    }
                }
            });
        });
    });
}
exports.Initialize = Initialize;
function GetQuota(appid, callback) {
    var runtime = GetAppByAppId(appid);
    if (!runtime) {
        callback(new Error("App not found"));
    }
    else {
        runtime.QuotaUsage(callback);
    }
}
exports.GetQuota = GetQuota;
function SetQuota(appid, target, callback) {
    var runtime = GetAppByAppId(appid);
    if (!runtime) {
        callback(new Error("App not found"));
    }
    else {
        runtime.Quota(callback, target);
    }
}
exports.SetQuota = SetQuota;
(__API(GetQuota, "App.Manager.GetQuota", [8 /* AppCrossTalk */]));
(__API(SetQuota, "App.Manager.SetQuota", [0 /* System */]));
(__API(LoadApplication, "App.Manager.Load", [0 /* System */]));
(__API(GetPooledApps, "App.Manager.List", [8 /* AppCrossTalk */]));
