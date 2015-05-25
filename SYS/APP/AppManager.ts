import _Runtime = require("./Runtime");
import Runtime = _Runtime.Runtime;
import RuntimePool = require('./RuntimePool');
import fs = require("fs");
import net = require('net');
import path = require('path');
import PermissionLib = require('../API/Permission');
import _Application = require('../DB/Models/Application');
import Application = _Application.Application;
import IApplication = _Application.IApplication;
import Server = require('../API/Server');
import User = require('../Common/Native/user');
import http = require('http');
var unzip = require("unzip");

function GetAppURL(order_id:string, callback:Callback) {
    callback(null, order_id);
}
/**
 * Install APP
 */
export function Install(app_uid:string, callback:Callback) {
    GetAppURL(app_uid, (err, url) => {
        if(err){
            error(err);
            return callback(err);
        }
        var fileName = path.basename(url);
        var appPath = "";
        var appPackagePath = path.join(CONF.APP_BASE_PATH, fileName);
        var appStream = fs.createWriteStream(appPackagePath);
        http.get(url, (res)=> {
            res.pipe(appStream);
        })
            .on('error', (err) => {
                error(err);
                return callback(err);
            });
        appStream
            .on('error', (err)=> {
                error(err);
                return callback(err);
            })
            .on('finish', ()=> {
                var target = <any>undefined;
                fs.createReadStream(appPackagePath)
                    .pipe(unzip.Parse())
                    .on('entry', function (entry) {
                        var fileName = entry.path;
                        if (fileName === "manifest.json") {
                            var json = "";
                            entry.on("data", (d) => {
                                json += d;
                            });
                            entry.on("end", () => {
                                try {
                                    info(JSON.parse(json));
                                    target = JSON.parse(json);
                                } catch (err) {
                                    error(err);
                                    return callback(err);
                                }
                            });
                        } else {
                            entry.autodrain();
                        }
                    }).on("close", () => {
                        if (target) {
                            var name = target.name;
                            appPath = path.join(CONF.APP_BASE_PATH, name);
                            fatal("Extracting..");
                            fs.createReadStream(appPackagePath)
                                .pipe(unzip.Extract({path: appPath}))
                                .on('error', (err)=> {
                                    error(err);
                                    return callback(err);
                                })
                                .on("close", () => {
                                    var app_sig = "";
                                    //if (!CONF.BYPASS_APP_SIGCHECK) { // ==> sig
                                    //    fatal("Sign APP..");
                                    //    app_sig = _SIGN_APP(appPath);
                                    //}
                                    InsertOrUpdate(name, target, app_sig, (err) => {
                                        if (err) {
                                            error(err);
                                            return callback(err);
                                        }
                                        else {
                                            fatal("Deploy Complete");
                                            return callback();
                                        }
                                    });
                                });
                        } else {
                            callback(new Error("Missing manifest :("));
                        }
                    });
            });
    });
}

/**
 * UnInstall APP
 */
export function UnInstall(app_uid:string, callback:Callback) {
    RuntimePool.UnloadApplication(app_uid, () => {
        Application.table().get(app_uid, (err, record) => {
            if (err) callback(err);
            else {
                record.remove((err)=> {
                    if (err) error(err);
                    callback();
                });
            }
        });
    });
}

export function InsertOrUpdate(app_uid:string, manifest, appsig, callback:Callback) {
    trace("Installing " + app_uid);
    trace(manifest);
    Application.table().one({uid: app_uid}, (err, result) => {
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

export function GetInstalledApps(callback:(err:Error, result:IApplication[]) => any) {
    Application.table().all({}, (err, results) => {
        if (err) return callback(err, void 0);
        else {
            return callback(void 0, results);
        }
    });
}

export function GetAllApplications(callback) {
    Application.table().all({}, callback);
}

export function GetOneByUID(uid, callback) {
    Application.table().one({uid: uid}, callback);
}

export function GetAppRootPath(app_uid) {
    return path.join(/*SHADOW_BASE_PATH, */CONF.APP_BASE_PATH, app_uid);
};

export function GetSDataPath(pth) {
    return path.join(CONF.SHADOW_DATA_PATH, pth);
}

export function SetOwner_Recursive(folder, owner, cb) {
    exec("chown", "-R", owner, folder, cb);
}

export function SetAppsRoot_Upward(folder) {
    do {
        fs.chownSync(folder, 0, 0);
        fs.chmodSync(folder, '0744');
        folder = path.dirname(folder);
    } while (folder !== '/');
}

export function SetupAppDataDir(app_id, runtime_id, cb) {

    var path = GetAppDataDir(app_id);

    var done = (err, result) => {
        cb(err, path);
    };
    warn("CHMOD 711 IS NOT SECURE!!!!!!");
    if (fs.exists(path, (exist) => {
            if (!exist) {
                fs.mkdir(path, (err) => {
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

export function GetAppDataLn(app_id) {
    return path.join(CONF.APP_BASE_PATH, app_id, "Data");
};

export function GetAppDataDir(app_id) {
    return GetSDataPath("App/" + app_id);
}

export function GetRealAppDataDir(app_id) {
    return path.join(CONF.BASE_DATA_PATH, "App/" + app_id);
}