require("colors");
require("../Modules/Shared/use");
global.wait = require("wait.for");
global.async = require("async");
var middlewares = require("./Middlewares");
var connect = require("connect");
var logger = require("morgan");
var bodyParser = require('body-parser');
var express = require("express");
var Data = require("./Storage");
function Initialize(port, callback) {
    console.log("Init : " + (port + "")["cyanBG"].bold);
    var SERVER = express();
    global.SERVER = SERVER;
    SERVER.use(logger("dev"));
    SERVER.use(bodyParser.json());
    SERVER.use(bodyParser.urlencoded());
    SERVER.use(middlewares.Compatibility);
    SERVER.use(middlewares.RequestFidelity);
    SERVER.use(middlewares.Authentication);
    SERVER.use(middlewares.Device);
    var trycatch = function (what, req, res, next) {
        wait.launchFiber(function () {
            try {
                what(req, res, next);
            }
            catch (e) {
                next(e);
            }
        });
    };
    global.get = function (route, cb) {
        console.log("GET " + (route + "").bold);
        SERVER.get(route, function (req, res, next) {
            trycatch(cb, req, res, next);
        });
    };
    global.post = function (route, cb) {
        console.log("POST " + (route + "").bold);
        SERVER.post(route, function (req, res, next) {
            trycatch(cb, req, res, next);
        });
    };
    global.put = function (route, cb) {
        console.log("PUT " + (route + "").bold);
        SERVER.put(route, function (req, res, next) {
            trycatch(cb, req, res, next);
        });
    };
    global.del = function (route, cb) {
        console.log("DEL " + (route + "").bold);
        SERVER.del(route, function (req, res, next) {
            trycatch(cb, req, res, next);
        });
    };
    require("./Services/Device");
    require("./Services/Ticket");
    require("./Services/User");
    SERVER.use(middlewares.ErrorHandler);
    SERVER.listen(port, function () {
        callback(null, true);
        console.log("LISTENING");
    });
}
exports.Initialize = Initialize;
function InitDB(cb) {
    Data.Initialize("data.db", function (err, db) {
        cb(err, db);
    });
}
function GenerateDummyData(cb) {
    var prvk = "-----BEGIN RSA PRIVATE KEY-----\n" + "MIIBOgIBAAJBAKy3a1HvbB01R8oBz7ulyd3bXn1iYGluOSswkvArRXp + Mosk1XsT\n" + "OT3gT9M8M5lsAOX60183if5d4dstUOr2A3cCAwEAAQJARs4u5fkkNlkoZA0YD1Jp\n" + "DlWnR / mzkqVINIeGRYVHx24WVAyR36tA53sjgqpa6CM0nZy7eyNPokkOdnF664Ul\n" + "yQIhANts8ZTHjjdZzTfWRsvpFm8eFNBMLg2YMRQ1iIb + VXjtAiEAyYFdCRw1AseT\n" + "HhtzabRCRtnig6INEh98k98ZwZPSVXMCIHKo3RxHovMdg / U3jUskg8qQx4OJK0 + D\n" + "RbIvvyX7ZSKJAiATg9bJyhSMN13VHZ140D9W80UPsIMJjUkYXRP2fmVxZwIhANnI\n" + "xXK7lecV / 1vQtXOmeiKFIWf1WIYtWb9dy+ tDoFmG\n" + "-----END RSA PRIVATE KEY-----\n";
    Data.Models.Router.Table.get("TEST_ROUTER_0", function (err, result) {
        if (!result) {
            var router = new Data.Models.Router.Router();
            router.checksumkey = prvk;
            router.uid = "TEST_ROUTER_0";
            Data.Models.Router.Table.create(router, cb);
        }
        else {
            cb();
        }
    });
}
async.series([
    InitDB,
    GenerateDummyData,
    Initialize.bind(null, 8080)
], function () {
});
