eval(LOG("APP:Resource:Shared:OUI"));

var level;
var db;
import path = require("path");
import fs = require("fs");
var readline = require("linebyline");
import http = require('http');

var DB_PATH = path.join(CONF.RESOURCE_STORE_DIR, '/OUI/Database');
var TXT_PATH = path.join(CONF.RESOURCE_STORE_DIR, '/OUI/OUI.txt');
var TXTSWP_PATH = path.join(CONF.RESOURCE_STORE_DIR, '/OUI/OUI_SWAP');

export function update(cb) {
    //http://standards-oui.ieee.org/oui.txt
    http.request({
        method: "GET",
        host: "standards-oui.ieee.org",
        port: 80,
        path: "/oui.txt"
    }, function(response) {
        var out = fs.createWriteStream(TXTSWP_PATH);
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            out.write(chunk);
        }).on('end', function() {
            out.end();
            Rebuild(TXTSWP_PATH, (err) => {
                if (!err) {
                    try {
                        fs.unlinkSync(TXT_PATH);
                        fs.renameSync(TXTSWP_PATH, TXT_PATH);
                    } catch (e) {
                        return cb(e);
                    }
                    info("OUI UPDATE SUCCESS");
                    return cb();
                }
            });
        }).on('close', function() {
            out.end();
            fs.unlink(TXTSWP_PATH, function(err) {/* jshint unused: false */
                cb(new Error('premature eof OUI db'), null);
            });
        });
    }).on('error', function(err) {
        cb(err, null);
    })['end'];
}

export function Rebuild(fileName, cb) {
    console.log("Rebuild Scheduled - Expect delays");
    hotswap("OUI_DB", (done) => {
        info("Rebuilding OUI Database, Go CPU Go!");
        fileName = fileName ? fileName : TXT_PATH;
        info(" - feeding in " + fileName);
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
                //console.log((cur + "").bold);
                console.log("Done Loading.. Hotplug in progress");
                done();
                cb();
            }
        }

        rd.on('line', function(line) {
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

        rd.on('close', function() {
            loaded = true;
            console.log("Loaded");
            doneCheck();
        });

        rd.on("error", function(err) {
            loaded = true;
            console.log(err);
            doneCheck();
        });

    });
}

export function OUI_Find(mac: string, callback) {
    hotswapSafe("OUI_DB", callback, (done) => {
        db.get(mac.toLowerCase(), {}, done);
    });
}

export function Initialize(cb) {
    level = require("levelup");
    var fs = require("fs");
    var rebulid = false;
    var dbPath = DB_PATH; // oops
    if(!fs.existsSync(dbPath)) {
        rebulid = true;
        fs.mkdirSync(dbPath);
        fs.chownSync(dbPath, process.getuid(), process.getgid());
        fs.chmodSync(dbPath, '0775');
    }

    //var lockPath = path.join(dbPath, 'LOCK');
    //if (!fs.existsSync(lockPath))
    //    fs.writeFileSync(lockPath, '');

    db = level(dbPath, { 'createIfMissing': true, 'valueEncoding': 'json' }, () => { });
    db.open();
    if (!rebulid) {
        return cb();
    }
    else {
        return Rebuild(undefined, cb);
    }
}

process.on('exit', () => {
    db.close();
});

__API(OUI_Find, "Resource.OUISearch");