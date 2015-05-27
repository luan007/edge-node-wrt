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

import Data = require("./Storage");

export function Initialize(port, callback:Callback) {

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

    var appkey = '-----BEGIN RSA PRIVATE KEY-----\n' +
        'MIIEogIBAAKCAQEAlfnyLpIIpNgNypJdVqf4fkhD1pW8rOHi/r0rNbtqXrVleqyY\n' +
        'qYsFtD51Xiz3ZwzgO81oD826+WLuHTT2uKRXBf/Q/o71/tnwlfAitvMJPcVXVpni\n' +
        'G4g0F7Tsjk/kW8XbXihOmNDrOX9a7k8SNdKvRS23xDDVied+HOYnTt7wSX8sTQdA\n' +
        'V4SIvLZMsfzTE0+e8QQroTGCStk2L446XqokAtw5shMQRG/Q0wEGF2R1y3C8SfQV\n' +
        't3ba8l7DrsjMx+WlGbjj5bXjtat9fTpv65Qbm3p7oH4LqM2KsOPk6vKrwDQpu7HG\n' +
        'h6qF0VZ1WkQouTVU25VlwFWuuE/sojsllBpcsQIDAQABAoIBAGeZ+cph5sa42Q4O\n' +
        'fZvW/Ll/gh1B4swqXnxKgQblKF20QR21DOBRwOb6Hmmn9l+hbWTiR/hizb5osMRM\n' +
        'SgLSw6rJRL4UU6pxMtjgwZpP2RpqsCKKur76H8IgoSjN15nt29P3VBQMffGCIHZu\n' +
        '+M1ldN387u0ALwLMfznHY3AAYUzjDXRlYN7d+cM0q/qnMIlJlSA4Iv4uY9R4YLls\n' +
        'Eotj1QcE5DetujxRG5HDsiB8+9og7gwnG7Qv3D4ebwRWW7xXTV7rBkBEWx//9AIf\n' +
        'Qmz51YMypaZxv535SrezORYo0GB5CaceYdcEvixqKtpIWfVOFOsNF1SSLIUuaMAO\n' +
        'Qj9D8AECgYEA/FOkQJNerKsMtcwngRizejtww80acDltDaFC4k7S+bapI51hlbSf\n' +
        'SkFdVOLj6Vp/ANIty09mSl8VEY0n5PpWRNJFEX5zZHMfKc499F/7e2A7mPtTATyI\n' +
        'k0lqjDBJpp8YeeUpXiv0NPdgTgiFGtjHijI8mdcDAbiTp/E0Z4q9oaECgYEAmCje\n' +
        'yOoEsmX+jOdxpMLdeb70mmno04iOAxa/zv6oy1PhDVL5fH7U3n6kzRfTlJbH+hfj\n' +
        'BHNPCRmVWXMpYxsI9xyQm+sod10s/QqqH9MXxmIxwvj/N2QH79gJeClYmIGjKWQJ\n' +
        'PTdZXkfL83OoDKsjf7I/UHLKr2Z0ID0WeNZBARECgYAZ+RodM445Q9opFHy0gzBm\n' +
        'UpwG66PfDWo2TvUtimOZJL5AVkDnQhJreFL9G+XN7WzJTtk75k5nNWZbyiXjIgmj\n' +
        'R+moJVYHbvo0OXCTKRYf2wYHd0dSB0MfthzrlUTfi9zfH0Gk2e1nTldxcNsSqmHP\n' +
        'zeADDejXUoKQdPmp9tQSQQKBgHDDGRdcFk7/Nz3E53tqzidDVJJ6mojpUhUH7u2/\n' +
        '2+eTKd1t+GZCuA6LXCaB2dLsSxcUTLEnoxLjWsMHjUxc5K/9A04JX9vVuVltZdZf\n' +
        '4earLqWHUdwCzb75I0thmL6sk/ZApHgxZJFyM7sfoxKAYbZoqnM8HukNzFF39Adp\n' +
        'AJOBAoGAXY76d4MV+K0OXvA1L5o/YS+zCbhfipcmLStRwA2LUsWhS6QZCEAdh4fC\n' +
        'O20wSn5ye7WEfzLj/H828fBLe75iI9ehc/XZ4ilEQE1fgv0OaANg7rpoZVnZDssO\n' +
        'FD+fy8Jes0RdVMEij5HfhkBJMViSPZNTurrQvaAGm+1ILbHPJCQ=\n' +
        '-----END RSA PRIVATE KEY-----';

    var jobs = [];
    jobs.push((cb) => {
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

    jobs.push((cb)=> {
        Data.Models.Router.Table.get('TestApp', (err, result) => {
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