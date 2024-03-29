﻿import http = require("http");
import express = require("express");
import Core = require("Core");
var unzip = require("unzip");
//This is for test only
//Eliminate this BEFORE LAUNCH
var multer = require('multer');
var app = express()
var fs = require("fs");

app.use((req, res, next) => {
    console.log('%s %s %s', req.method, req.url, req.path);
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', function (req, res) {
    Core.App.RuntimePool.GetInstalledApps((err, result) => {
        Core.App.RuntimePool.GetPooledApps((err, pool) => {
            res.render("index", {
                Installed: result,
                Pooled: pool
            });
        });
    });
});

app.get('/load/:id', function (req, res) {
    trace("Loading " + req.params.id);
    Core.App.RuntimePool.LoadApplication(req.params.id,() => {
        trace(" -> done..");
        trace(arguments);
        res.redirect(302, "/");
    });
});

app.get('/unload/:id', function (req, res) {
    trace("Unloading " + req.params.id);
    Core.App.RuntimePool.UnloadApplication(req.params.id,() => {
        trace(" -> done..");
        trace(arguments);
        res.redirect(302, "/");
    });
});

app.post('/', <any>[multer({
    dest: '/tmp/fdscok'
}), (req, res) => {
    console.log(req.body); // form fields
    if (req.files.package) {
        var file = req.files.package.path;
        trace(file);

        var clean = function () {
            trace("Clean - " + file);
            fs.unlink(file,(err) => {
                if (err) error(err);
            });
        }

        var target = undefined;
        fs.createReadStream(file)
            .pipe(unzip.Parse())
            .on('entry', function (entry) {
            var fileName = entry.path;
            if (fileName === "manifest.json") {
                var json = "";
                entry.on("data",(d) => {
                    json += d;
                });
                entry.on("end",() => {
                    try {
                        info(JSON.parse(json));
                        target = JSON.parse(json);
                    } catch (e) {
                        error(e);
                    }
                });
            } else {
                entry.autodrain();
            }
        }).on("close",() => {
            if (target) {
                var name = target.name;
                info("Extracting..");
                fs.createReadStream(file)
                    .pipe(unzip.Extract({ path: '../Applications/' + name }))
                    .on("close",() => {
                    Core.App.RuntimePool.Install(name, target, "",(err) => {
                        if (err) error(err);
                        else {
                            res.status(200).end();
                            info("Deploy Complete");
                        }
                    });
                });
            } else {
                res.status(500).end();
                warn("Missing manifest :(");
                clean();
            }
        });
    } else {
        res.status(404).end();
    }
}]);

app.listen(10086);

warn("DEPLOYMENT SERVER @ 10086");