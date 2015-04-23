global.path = require("path");
global.http = require("http");
global.qs = require("querystring");
global.async = require("async");
require("./Base/SystemEvent");
require("./Base/Global");
require("./Lib/Log/Prelaunch");
require("./Lib/Sockets/SockPath");
require("../Modules/Shared/_Module");
require("colors");
require("Node");
//require("Core");
import Loader = require("./loader");

Loader.Load(["Base", "Lib", "Data", "API", "SubSys", "Device", "User", "App", "Router", "Test"], (err, result) => {
    process.nextTick(() => {
        if (err) {
            SYS_TRIGGER(SYS_EVENT_TYPE.ERROR, err);
            console.log(err);
            console.log(err.stack);
        } else {
            SYS_TRIGGER(SYS_EVENT_TYPE.LOADED, err);
        }
    });
});

process.on("uncaughtException",(err) => {
    console.log("Error:" + err.name);
    console.log(err.message);
    console.log("------------------");
    console.log(err.stack);
    console.log("------------------");
});