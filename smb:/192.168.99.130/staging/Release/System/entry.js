global.path = require("path");
global.http = require("http");
global.qs = require("querystring");
global.async = require("async");
require("colors");
require("Node");
require("Core");
var Loader = require("./loader");
Loader.Load(["Base", "Lib", "Data", "API", "SubSys", "Device", "User", "App", "Router", "Test"], function (err, result) {
    process.nextTick(function () {
        if (err) {
            SYS_TRIGGER(1 /* ERROR */, err);
            console.log(err);
        }
        else {
            SYS_TRIGGER(0 /* LOADED */, err);
        }
    });
});
process.on("uncaughtException", function (err) {
    console.log("Error:" + err.name);
    console.log(err.message);
    console.log("------------------");
    console.log(err.stack);
    console.log("------------------");
});
