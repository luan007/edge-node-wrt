import _Runtime = require("./Runtime");
import Runtime = _Runtime.Runtime;
import fs = require("fs");
import net = require('net');
import path = require('path');
import PermissionLib = require('../API/Permission');
import _Application = require('../DB/Models/Application');
import Application = _Application.Application;
import IApplication = _Application.IApplication;
import Server = require('../API/Server');
import User = require('../Common/Native/user');

export function Install(app_uid:string, manifest, appsig, callback:Callback) {
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
    Application.table().one({ uid: uid }, callback);
}

export function GetSPath(pth) {
    return path.join(CONF.SHADOW_BASE_PATH, pth);
}

export function GetAppRootPath (app_uid) {
    return path.join(/*SHADOW_BASE_PATH, */CONF.APP_BASE_PATH, app_uid);
};

export function GetSDataPath(pth) {
    return path.join(CONF.SHADOW_DATA_PATH, pth);
}

export function SetOwner_Recursive(folder, owner, cb) {
    exec("chown", "-R", owner, folder, cb);
}

export function SetAppsRoot_Upward(folder){
    do {
        fs.chownSync(folder, 0, 0);
        folder = path.dirname(folder);
    } while (folder !== '/');
}

export function SetupAppDataDir(app_id, runtime_id, cb) {

    var path = GetAppDataDir(app_id);

    var done = (err, result) => {
        cb(err, path);
    };
    error("CHMOD 711 IS NOT SECURE!!!!!!");
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