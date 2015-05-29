var level;
var db;
import path = require("path");
var fs = require("fs");
var readline = require("linebyline");
require("./flowcontrol");

export function update_scheduler() {
    //http://standards-oui.ieee.org/oui.txt
}

export function Rebuild(fileName, cb) {
    console.log("Rebuild Scheduled - Expect delays");
    hotswap("OUI_DB", (done) => {
        console.log("Rebuilding OUI Database, Go CPU Go!");
        fileName = fileName ? fileName : path.join(process.env.ROOT_PATH, "OUI/OUI.txt");
        console.log(" - feeding in " + fileName);
        var match = /([\w]{2})-([\w]{2})-([\w]{2})\s+\(hex\)\s+(.+)/;
        var rd = readline(fileName);
        var total = 0;
        var cur = 0;
        var loaded = false;
        function check() {
            cur++;
            doneCheck();
        }

        function doneCheck() {
            if (loaded && cur >= total) {
                //done
                console.log((cur + "").bold);
                console.log("Done Loading.. Hotplug in progress");
                done();
                cb();
            }
        }

        rd.on('line', function (line) {
            if (match.test(line)) {
                var arr = match.exec(line);
                var n1 = arr[1].toString().toLowerCase();
                var n2 = arr[2].toString().toLowerCase();
                var n3 = arr[3].toString().toLowerCase();
                total++;
                var corp = arr[4];
                console.log(n1 + ":" + n2 + ":" + n3 + "~" + corp);
                db.put(n1 + ":" + n2 + ":" + n3, corp, check);
            }
        });

        rd.on('close', function () {
            loaded = true;
            console.log("Loaded");
            doneCheck();
        });

        rd.on("error", function (err) {
            loaded = true;
            console.log(err);
            doneCheck();
        });

    });
}

export function OUI_Find(mac: string, callback) {
    hotswapSafe("OUI_DB", callback,(done) => {
        db.get(mac.toLowerCase(), {}, done);
    });
}

export function Initialize(cb) {
    level = require("levelup");
    var fs = require("fs");
    var rebulid = false;
    var dbPath = path.join(process.env.ROOT_PATH, 'Data'); // oops
    if (!fs.existsSync(dbPath)) {
        rebulid = true;
        //fs.mkdirSync(dbPath);
        //fs.chownSync(dbPath, process.getuid(), process.getgid());
        //fs.chmodSync(dbPath, '0775');
    }
    db = level(dbPath);
    db.open();
    if (!rebulid) {
        return cb();
    }
    else {
        return Rebuild(undefined, cb);
    }
}