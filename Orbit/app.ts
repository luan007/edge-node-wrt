process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;
require("./Env");
global.wait = require("wait.for");
global.async = require("async");
import middlewares = require("./Middlewares");
var connect = require("connect");
var logger = require("morgan");
var bodyParser = require('body-parser');
import express = require("express");
import async = require('async');
var fs = require('fs');
var child_process = require('child_process');

import Data = require("./Storage");

export function Initialize(port, callback:Callback) {
    console.log("Clear tmp..."["cyanBG"].bold);
    child_process.exec('rm -rf '+ ORBIT_CONF.PKG_TMP_PATH + '/*', (err, stdout, stderr)=> {
        if(err) console.log('error occurs during clean:', err);
    });

    console.log("Init : " + (port + "")["cyanBG"].bold);

    var SERVER = express();
    global.SERVER = SERVER;

    SERVER.use(logger("dev"));
    SERVER.use(bodyParser.json());
    SERVER.use(bodyParser.urlencoded());

    //SERVER.use(connect.json());
    //SERVER.use(connect.urlencoded());
    //SERVER.use(connect.query());
    //SERVER.use(connect.compress());

    SERVER.use(middlewares.Compatibility);
    SERVER.use(middlewares.RequestFidelity);
    SERVER.use(middlewares.Authentication);
    SERVER.use(middlewares.Device);

    /*workaround for fiber (exception handling)*/
    var trycatch = (what, req, res, next) => {
        wait.launchFiber(() => {
            try {
                what(req, res, next);
            }
            catch (e) {
                next(e);
            }
        });
    };

    global.get = (route, cb:(req, res, next) => any) => {
        console.log("GET " + (route + "").bold);
        SERVER.get(route, (req, res, next) => {
            trycatch(cb, req, res, next);
        });
    };

    global.post = (route, cb) => {
        console.log("POST " + (route + "").bold);
        SERVER.post(route, (req, res, next) => {
            trycatch(cb, req, res, next);
        });
    };

    global.put = (route, cb) => {
        console.log("PUT " + (route + "").bold);
        SERVER.put(route, (req, res, next) => {
            trycatch(cb, req, res, next);
        });
    };

    global.del = (route, cb) => {
        console.log("DEL " + (route + "").bold);
        SERVER.del(route, (req, res, next) => {
            trycatch(cb, req, res, next);
        });
    };

    require("./Services/Device");
    require("./Services/Ticket");
    require("./Services/User");
    require('./Services/Apps');
    require('./Services/Packages');

    SERVER.use(middlewares.ErrorHandler);

    SERVER.listen(port, () => {
        callback(null, true);
        console.log("LISTENING");
    });
}


function InitDB(cb) {
    Data.Initialize("root:system@localhost/edge", (err, db) => {
        cb(err, db);
    });
}

function GetVersionNo(version) {
    var verNo = 0;
    var parts = version.split('.');
    if (parts.length < 3)
        throw new Error('illegal version.');
    for (var i = 0; i < 3; i++) {
        verNo += parseInt(parts[i]) * Math.pow(10, 3 * (2 - i));
    }
    return verNo;
}

function GenerateDummyData(cb) {
    var routerkey = '-----BEGIN RSA PRIVATE KEY-----\n' +
        'MIIBOgIBAAJBAKy3a1HvbB01R8oBz7ulyd3bXn1iYGluOSswkvArRXp+Mosk1XsT\n' +
        'OT3gT9M8M5lsAOX60183if5d4dstUOr2A3cCAwEAAQJARs4u5fkkNlkoZA0YD1Jp\n' +
        'DlWnR/mzkqVINIeGRYVHx24WVAyR36tA53sjgqpa6CM0nZy7eyNPokkOdnF664Ul\n' +
        'yQIhANts8ZTHjjdZzTfWRsvpFm8eFNBMLg2YMRQ1iIb+VXjtAiEAyYFdCRw1AseT\n' +
        'HhtzabRCRtnig6INEh98k98ZwZPSVXMCIHKo3RxHovMdg/U3jUskg8qQx4OJK0+D\n' +
        'RbIvvyX7ZSKJAiATg9bJyhSMN13VHZ140D9W80UPsIMJjUkYXRP2fmVxZwIhANnI\n' +
        'xXK7lecV/1vQtXOmeiKFIWf1WIYtWb9dy+tDoFmG\n' +
        '-----END RSA PRIVATE KEY-----';

    var appkey = '-----BEGIN PUBLIC KEY-----\n' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlfnyLpIIpNgNypJdVqf4\n' +
        'fkhD1pW8rOHi/r0rNbtqXrVleqyYqYsFtD51Xiz3ZwzgO81oD826+WLuHTT2uKRX\n' +
        'Bf/Q/o71/tnwlfAitvMJPcVXVpniG4g0F7Tsjk/kW8XbXihOmNDrOX9a7k8SNdKv\n' +
        'RS23xDDVied+HOYnTt7wSX8sTQdAV4SIvLZMsfzTE0+e8QQroTGCStk2L446Xqok\n' +
        'Atw5shMQRG/Q0wEGF2R1y3C8SfQVt3ba8l7DrsjMx+WlGbjj5bXjtat9fTpv65Qb\n' +
        'm3p7oH4LqM2KsOPk6vKrwDQpu7HGh6qF0VZ1WkQouTVU25VlwFWuuE/sojsllBpc\n' +
        'sQIDAQAB\n' +
        '-----END PUBLIC KEY-----';

    var jobs = [];
    jobs.push((cb) => { // Router
        Data.Models.Router.Table.get("TEST_ROUTER_0", (err, result) => {
            if (!result) {
                var router = new Data.Models.Router.Router();
                router.routerkey = routerkey;
                router.appkey = appkey;
                router.uid = "TEST_ROUTER_0";
                router.produced = true;
                router.active = true;
                Data.Models.Router.Table.create(router, cb);
            } else {
                cb();
            }
        });
    });

    jobs.push((cb)=> { // TestApp
        Data.Models.Application.Table.get('TestApp', (err, result) => {
            if (!result) {
                var app = new Data.Models.Application.Application();
                app.uid = 'TestApp';
                app.dirHashCode = '';
                app.name = 'TestApp';
                app.urlName = 'TestApp';
                Data.Models.Application.Table.create(app, cb);
            } else {
                cb();
            }
        });
    });

    jobs.push((cb)=> { // DriverApp
        Data.Models.Application.Table.get('DriverApp', (err, result) => {
            if (!result) {
                var app = new Data.Models.Application.Application();
                app.uid = 'DriverApp';
                app.dirHashCode = '';
                app.name = 'DriverApp';
                app.urlName = 'DriverApp';
                Data.Models.Application.Table.create(app, cb);
            } else {
                cb();
            }
        });
    });

    jobs.push((cb) => { // Package 1.0
        Data.Models.Package.Table.get('1.0.0', (err, result) => {
            if (!result) {
                var pkg = new Data.Models.Package.Package();
                pkg.version = '1.0.0';
                pkg.versionNo = GetVersionNo(pkg.version);
                pkg.pubTime = new Date();
                pkg.dirHashCode = '';
                pkg.description = '';
                Data.Models.Package.Table.create(pkg, cb);
            } else {
                cb();
            }
        });
    });

    async.series(jobs, () => {
        cb();
    });
}

async.series([
    InitDB,
    GenerateDummyData,
    Initialize.bind(null, 8080)
], () => {
});