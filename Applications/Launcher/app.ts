import http = require("http");
import fs = require("fs");
import path = require("path");
if (!global.EDGE) {
    global.async = require("async");
    require("../../Modules/Shared/use");
    console.log("Debug Env");
    async.series([
        (cb) => { require("./Auth/server").Initialize(9999, cb); },
        (cb) => { require("./Main/server").Initialize(8080, cb); }
    ],(err) => {
             console.log("Launcher is up @ " +
                    9999 + " ~ " + 8888);
        });
}
else {
    fs.stat("/");
    //Clean Up
    if (fs.existsSync("/Data/sock")) {
        var stat: fs.Stats;
        var old = fs.readdirSync("/Data/sock");
        for (var i = 0; i < old.length; i++) {
            try {
                fs.unlinkSync("/Data/sock/" + old[i]);
            } catch (e) {
                console.log(e);
            }
        }
        if ((stat = fs.statSync("/Data/sock")).isDirectory()) { }
        else {
            fs.unlinkSync("/Data/sock");
            fs.mkdirSync("/Data/sock");
        }
    }
    else {
        fs.mkdirSync("/Data/sock");
    }
    var MainPort = "sock/" + UUIDstr();
    var AuthPort = "sock/" + UUIDstr();
    async.series([
        (cb) => { require("Auth/server").Initialize("/Data/" + AuthPort, cb); },
        (cb) => { require("Main/server").Initialize("/Data/" + MainPort, cb); }
    ],(err) => {
            console.log("Settingup Launcher's port");
            API.Launcher.SetupPort(MainPort, AuthPort,(err, result) => {
                if (err) console.log(err);
                console.log("Launcher is up @ " +
                    MainPort + " ~ " + AuthPort);
            });
        });

}