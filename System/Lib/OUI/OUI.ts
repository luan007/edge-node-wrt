var level;
var db;
import path = require("path");

export function update_scheduler() {
    //http://standards-oui.ieee.org/oui.txt
}

export function Rebuild(fileName, cb) {
    warn("Rebuild Scheduled - Expect delays");
    hotswap("OUI_DB", (done) => {
        warn("Rebuilding OUI Database, Go CPU Go!");
        fileName = fileName ? fileName : path.join(CONF.BASE_PATH, "Lib/OUI/OUI.txt");
        warn(" - feeding in " + fileName);
        var readline = require("linebyline");
        var match = /([\w]{2})-([\w]{2})-([\w]{2})\s+\(hex\)\s+(.+)/;
        var fs = require("fs");
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
                fatal((cur + "").bold);
                fatal("Done Loading.. Hotplug in progress");
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
                trace(n1 + ":" + n2 + ":" + n3 + "~" + corp);
                db.put(n1 + ":" + n2 + ":" + n3, corp, check);
            }
        });

        rd.on('close', function () {
            loaded = true;
            fatal("Loaded");
            doneCheck();
        });

        rd.on("error", function (err) {
            loaded = true;
            error(err);
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
    var rebulid = CONF.IS_DEBUG && CONF.ALWAYS_REBUILD_OUI;
    if (!fs.existsSync("./Lib/OUI/OUI")) {
        rebulid = true;
    }
    db = level("./Lib/OUI/OUI");
    db.open();
    global.OUI_Find = OUI_Find;
    if (!rebulid) {
        return cb();
    }
    else {
        return Rebuild(undefined, cb);
    }
}