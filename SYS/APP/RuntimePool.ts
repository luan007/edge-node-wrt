import Runtime = require("./Runtime");
import fs = require("fs");
import net = require('net');
import PermissionLib = require('../API/Permission');
import _Application = require('../DB/Models/Application');
import Application = _Application.Application;
import IApplication = _Application.IApplication;
import Server = require('../API/Server');
import User = require('../Common/Native/user');

//APP_ID : APP_STRUCT
var _pool: IDic<Runtime> = <any>{};
//RUNTIME_ID: APP_ID
var _runtime_map: string[] = <any>{};

var _resp_scanner;

function ResponsivenessScan() {
    var keys = Object.keys(_pool);
    for (var i = 0; i < keys.length; i++) {
        var runtime: Runtime = _pool[keys[i]];
        runtime.UpdateResponsiveness();
    }
}

function ConnectionHandler(
    credential: { uid; pid; gid; },
    socket: net.Socket,
    callback: (handled: boolean) => any
    ) {
    trace("RPC Socket Scan (APP) ~ " + credential.pid);
    var keys = Object.keys(_pool);
    for (var i = 0; i < keys.length; i++) {
        var runtime: Runtime = _pool[keys[i]];
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

export function LoadApplication(app_uid: string, callback: PCallback<string>) {

    if (!app_uid) return callback(new Error("Invalid Parameter"));
    if (_pool[app_uid] && !_pool[app_uid].IsRunning()) {
        trace("App is loaded, Starting " + app_uid);
        _pool[app_uid].Start();
        return callback(undefined,(<Runtime>_pool[app_uid]).RuntimeId);
    } else if (_pool[app_uid]) {
        return callback(undefined,(<Runtime>_pool[app_uid]).RuntimeId);
    }
    Application.table().one({ uid: app_uid },(err, result) => {
        trace("Loading App.. " + app_uid);
        if (err) {
            return callback(err, undefined);
        }
        var id = UUIDstr();
        var runtime: Runtime;
        try {
            runtime = new Runtime(id, result);
        } catch (e) {
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

export function UnloadApplication(app_uid: string, callback: Callback) {
    if (has(_pool, app_uid)) {
        _pool[app_uid].SafeQuit();
        delete _runtime_map[_pool[app_uid].RuntimeId];
        delete _pool[app_uid];
    }
    process.nextTick(callback);
}

export function Install(app_uid: string, manifest, appsig, callback: Callback) {
    trace("Installing " + app_uid);
    trace(manifest);
    Application.table().one({ uid: app_uid },(err, result) => {
        //Upgrade?
        var upgrade = false;
        var data = <any>{};
        if (!err && result) {
            upgrade = true;
        }
        data.appsig = appsig;
        data.name = manifest.name;
        data.uid = app_uid;
        data.urlName = manifest.name; //TBC
        if (upgrade) {
            info("Upgrading " + app_uid);
            result.save(data, callback);
        } else {
            info("Saving " + app_uid);
            Application.table().create(data, callback);
        }
    });
}

export function GetPooledApps(callback) {
    var keys = Object.keys(_pool);
    var results = [];
    for (var i = 0; i < keys.length; i++) {
        results.push(_pool[keys[i]].GetSnapshot());
    }
    callback(undefined, results);
}

export function GetInstalledApps(callback: (err: Error, result: IApplication[]) => any) {
    Application.table().all({},(err, results) => {
        if (err) return callback(err, void 0);
        else {
            return callback(void 0, results);
        }
    });
}

export function GetLauncher() {
    return _pool[CONF.CORE_PARTS["LAUNCHER"]];
}

export function GetAppByRID(runtimeId): Runtime {
    if (_runtime_map[runtimeId]) {
        return _pool[_runtime_map[runtimeId]];
    }
}

export function GetAppByAppId(appId): Runtime {
    return _pool[appId];
}

export function GetCallingRuntime(context): Runtime {
    if (SenderType(context) !== CONF.SENDER_TYPE_APP ||
        SenderId(context) === undefined) {
        return undefined;
    } else {
        return _pool[_runtime_map[SenderId(context)]];
    }
}

export function Initialize() {
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
            Application.table().all({}, (err, results) => {
                if (err) {
                    return error(err);
                } else {
                    for (var i = 0; i < results.length; i++) {
                        LoadApplication(results[i].uid, () => { /*SWALLOW*/ });
                    }
                }
            });

        });

    });
}

export function GetQuota(appid, callback) {
    var runtime = GetAppByAppId(appid);
    if (!runtime) {
        callback(new Error("App not found"));
    } else {
        runtime.QuotaUsage(callback);
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

(__API(GetQuota, "App.Manager.GetQuota", [Permission.AppCrossTalk]));
(__API(SetQuota, "App.Manager.SetQuota", [Permission.System]));
(__API(LoadApplication, "App.Manager.Load", [Permission.System]));
(__API(GetPooledApps, "App.Manager.List", [Permission.AppCrossTalk]));