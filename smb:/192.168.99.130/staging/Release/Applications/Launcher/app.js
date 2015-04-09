var fs = require("fs");
if (!global.EDGE) {
    global.async = require("async");
    require("../../Modules/Shared/use");
    console.log("Debug Env");
    async.series([
        function (cb) {
            require("./Auth/server").Initialize(9999, cb);
        },
        function (cb) {
            require("./Main_Staging/server").Initialize(8080, cb);
        }
    ], function (err) {
        console.log("Launcher is up @ " + 9999 + " ~ " + 8888);
    });
}
else {
    fs.stat("/");
    if (fs.existsSync("/Data/sock")) {
        var stat;
        var old = fs.readdirSync("/Data/sock");
        for (var i = 0; i < old.length; i++) {
            try {
                fs.unlinkSync("/Data/sock/" + old[i]);
            }
            catch (e) {
                console.log(e);
            }
        }
        if ((stat = fs.statSync("/Data/sock")).isDirectory()) {
        }
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
        function (cb) {
            require("./Auth/server").Initialize("/Data/" + AuthPort, cb);
        },
        function (cb) {
            require("./Main_Staging/server").Initialize("/Data/" + MainPort, cb);
        }
    ], function (err) {
        console.log("Settingup Launcher's port");
        API.Launcher.SetupPort(MainPort, AuthPort, function (err, result) {
            if (err)
                console.log(err);
            console.log("Launcher is up @ " + MainPort + " ~ " + AuthPort);
        });
    });
}
