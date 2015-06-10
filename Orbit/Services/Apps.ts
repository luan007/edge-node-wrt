import Storage = require("../Storage");
import validator = require("validator");
import Data = require("../Storage");
import path = require('path');
import RSA  = require('../Common/RSA');
import AES = require('../Common/AES');
import fs = require('fs');

get("/App/all/:page", (req, res, next) => {
    var page = parseInt(req.params.page);
    var ps = 10;
    Data.Models.Application.Table.find({}).limit(ps).offset((page - 1) * ps).run((err, applications)=> {
        if (err) return next(err);
        res.json(200, applications);
    });
});

post('/App/purchase/:app_uid', (req, res, next) => { // ===> app_sig
    var app_uid = req.params.app_uid;
    var router_uid = req.router.uid;
    var app_key = req.router.appkey;
    var router_key = req.router.routerkey;

    Data.Models.Application.Table.get(app_uid, (err, app) => { // should be exist in DB
        if (err) return next(err);
        else {
            if (app) {
                var aesPassword = AES.RandomPassword();
                var password = RSA.EncryptAESPassword(app_key, aesPassword);

                var salt = RSA.GenSalt(256);
                if (app.dirHashCode.trim() === '') {
                    var app_path = path.join(ORBIT_CONF.APP_BASE_PATH, app.uid);
                    app.dirHashCode = HashDir(app_path, salt).toString("hex");
                    app.save();
                }
                var app_sig = RSA.SignAppByHashCode(router_key, salt, app.dirHashCode); // sum per time.

                Data.Models.RouterApp.Table.find({app_uid: app_uid, router_uid: router_uid}, (err, routerApps)=> {
                    if (err) return next(err);
                    if (routerApps.length <= 0) {
                        Data.Models.RouterApp.Table.create({
                            router_uid: router_uid,
                            app_uid: app_uid,
                            password: aesPassword,
                            orderTime: new Date(),
                            installTime: new Date()
                        }, (err)=> {
                            if (err)
                                return next(err);
                            return res.json({password: password, app_sig: app_sig});
                        });
                    } else {
                        routerApps[0].orderTime = new Date();
                        routerApps[0].installTime = new Date();
                        routerApps[0].password = aesPassword;
                        routerApps[0].save((err) => {
                            if (err)
                                return next(err);
                            return res.json({password: password, app_sig: app_sig});
                        });
                    }
                });
            } else {
                return next(new Error('App not exist.'));
            }
        }
    });
});

post('/App/download/:app_uid', (req, res, next) => {
    var app_uid = req.params.app_uid;
    var router_uid = req.router.uid;
    Data.Models.RouterApp.Table.find({app_uid: app_uid, router_uid: router_uid}, (err, routerApps)=> {
        if (err) return next(err);
        console.log('routerApps', routerApps);
        if (routerApps.length > 0) {
            var appPackagePath = path.join(ORBIT_CONF.APP_BASE_PATH, routerApps[0].app_uid + '.zip');
            if (fs.existsSync(appPackagePath)) {
                console.log('appPackagePath'["cyanBG"].bold, appPackagePath);
                try {
                    var streamingProcess = AES.EncryptFileProcess(appPackagePath, routerApps[0].password);
                    streamingProcess.stderr.on('data', (data) => {
                        console.log('openssl stderr:'['yellowBG'].bold, data.toString());
                    });
                    streamingProcess.stdout.pipe(<any>res);
                } catch (err) {
                    return next(err);
                }
            } else {
                return next(new Error('.zip not exist on the server.'));
            }
        } else {
            return next(new Error('you have not purchased.'));
        }
    });
});