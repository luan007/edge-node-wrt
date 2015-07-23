﻿import _Application = require('../../../DB/Models/Application');
import Application = _Application.Application;
require('../../../Common/Remote/Client');

var jobs = [];

function GenerateAppRecord(app_uid, cb) {
    Application.table().get(app_uid, (err, app)=> {
        if (!app) {
            Application.table().create([
                {
                    uid: app_uid,
                    urlName: app_uid,
                    name: app_uid,
                    appsig: ""
                }
            ], (err, instance) => {
                console.log(app_uid, " App Data Generated ... ");
                cb();
            });
        } else {
            cb();
        }
    });
}

SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
    warn("Test - Data Generator Starting..");
    warn(" YOU WILL LOSE DATA!!");
    warn("Now.. Clearing Application Table");

    async.series([
            (cb)=> {
                GenerateAppRecord('Launcher', cb);
            },
            //(cb)=> {
            //    GenerateAppRecord('TestApp', cb);
            //},
            //(cb) => {
            //    GenerateAppRecord('DriverApp', cb);
            //},
            (cb) => {
                Orbit.Post("User", {name: "mikeluan", email: "1@emerge.cc", password: "1234567890"}, (err, result) => {
                    //cb();
                });
                Orbit.Post("User", {name: "christyyu", email: "0@emerge.cc", password: "1234567890"}, (err, result) => {
                    //cb();
                });
                Orbit.Post("User", {name: "amoschen", email: "amos.chen@emerge.cc", password: "1234567890"}, (err, result) => {
                    //cb();
                });
                Orbit.Post("User", {name: "olivia", email: "olivia@zhenfund.com", password: "1234567890"}, (err, result) => {
                    //cb();
                });
                cb();
            }],
        () => {
        });
});