﻿import http = require("http");
import express = require("express");
var unzip = require("unzip");
//This is for test only
//Eliminate this BEFORE LAUNCH
var multer = require('multer');
var _upload = multer({
    dest: '/tmp/fdsock'
});

var app = express()
var fs = require("fs");
import RuntimePool = require('../RuntimePool');
import AppManager = require('../AppManager');
import DevManager = require('../../Device/DeviceManager');

app.use((req, res, next) => {
    console.log('%s %s %s', req.method, req.url, req.path);
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', function (req, res) {
    AppManager.GetInstalledApps((err, result) => {
        RuntimePool.GetPooledApps((err, pool) => {
            res.render("index", {
                Installed: result,
                Pooled: pool,
                Devices: DevManager.Devices()
            });
        });
    });
});

app.get('/load/:id', function (req, res) {
    trace("Loading " + req.params.id);
    RuntimePool.LoadApplication(req.params.id,() => {
        trace(" -> done..");
        //trace(arguments);
        res.redirect(302, "/");
    });
});

app.get('/unload/:id', function (req, res) {
    trace("Unloading " + req.params.id);
    RuntimePool.UnloadApplication(req.params.id,() => {
        trace(" -> done..");
        //trace(arguments);
        res.redirect(302, "/");
    });
});

app.post('/', (req, res) => {
    _upload(req, res, (err) => {
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
    
            var target = <any>undefined;
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
                            json = json.replace(/\s/gmi, '');
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
                        .pipe(unzip.Extract({ path: '/storage/Apps/' + name }))
                        .on("close",() => {
                        AppManager.InsertOrUpdate(name, target, "",(err) => {
                            if (err) error(err);
                            else {
                                
                                res.send(200);
                                info("Deploy Complete");
                            }
                        });
                    });
                } else {
                    res.send(500);
                    warn("Missing manifest :(");
                    clean();
                }
            });
        } else {
            res.send(404);
        }
    });
});

export function Initialize(cb) {
    app.listen(10086);
    info("DEPLOYMENT SERVER @ 10086");
    cb();
}