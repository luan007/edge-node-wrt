import http = require("http");
import fs = require("fs");
fs.stat("/");
console.log("after");
var old = fs.readdirSync("/Data/sock");
for (var i = 0; i < old.length; i++) {
    try {
        fs.unlinkSync("/Data/sock/" + old[i]);
    } catch (e) {
        console.log(e);
    }
}
//Clean Up
if (fs.existsSync("/Data/sock")) {
    var stat: fs.Stats;
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
    (cb) => { require("/Auth").Initialize("/Data/" + AuthPort, cb); },
    (cb) => { require("/Main").Initialize("/Data/" + MainPort, cb); }
],(err) => {
    console.log("Settingup Launcher's port");
    API.Launcher.SetupPort(MainPort, AuthPort, (err, result) => {
        if (err) console.log(err);
        console.log("Launcher is up @ " +
            MainPort + " ~ " + AuthPort);
    });
});

