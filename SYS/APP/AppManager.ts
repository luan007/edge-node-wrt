import Runtime = require("./Runtime");
import fs = require("fs");
import net = require('net');
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