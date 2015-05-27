import Storage = require("../Storage");
import validator = require("validator");
import Data = require("../Storage");
import path = require('path');
import RSA  = require('../Common/RSA');
import fs = require('fs');

get("/App/all", (req, res, next) => {
    var page = parseInt(req.param('page'));
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

    Data.Models.Application.Table.get(app_uid, (err, app) => { // should be exist in DB
        if(err) return next(err);
        else {
            var salt = RSA.GenSalt(256);
            if(app.dirHashCode.trim() === '') {
                var app_path = path.join(ORBIT_CONF.APP_BASE_PATH, app.uid);
                app.dirHashCode =  HashDir(app_path, salt).toString("hex");
                app.save();
            }
            var app_sig = RSA.SignAppByHashCode(app_key, salt, app.dirHashCode); // sum per time.

            Data.Models.RouterApp.Table.find({app_uid: app_uid, router_uid: router_uid}, (err, routerApps)=> {
                if (err) return next(err);
                console.log('routerApps', routerApps, app_uid, router_uid);
                if (routerApps.length <= 0) {
                    //var app_path = path.join(ORBIT_CONF.APP_BASE_PATH, app_uid);
                    //var app_sig = RSA.SignApp(app_key, app_path);
                    var app_router_uid = UUIDstr();
                    Data.Models.RouterApp.Table.create({
                        uid: app_router_uid,
                        router_uid: router_uid,
                        app_uid: app_uid,
                        orderTime: new Date(),
                        installTime: new Date()
                    }, (err)=> {
                        if (err)
                            return next(err);
                        return res.json({app_sig: app_sig, app_router_uid: app_router_uid});
                    });
                } else {
                    return res.json({app_sig: app_sig, app_router_uid: routerApps[0].uid});
                }
            });
        }
    });
});

post('/App/download/:app_router_uid', (req, res, next) => {
    var app_router_uid = req.params.app_router_uid;
    Data.Models.RouterApp.Table.get(app_router_uid, (err, routerApp)=> {
        if (err) return next(err);
        console.log('routerApp', routerApp);
        if (routerApp) {
            var appPackagePath = path.join(ORBIT_CONF.APP_BASE_PATH, routerApp.app_uid + '.zip');
            console.log('appPackagePath'["cyanBG"].bold, appPackagePath);
            fs.createReadStream(appPackagePath).pipe(<any>res);
        } else {
            return next(new Error('you have not purchased.'));
        }
    });
});