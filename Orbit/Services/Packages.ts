import Storage = require("../Storage");
import validator = require("validator");
import Data = require("../Storage");
import path = require('path');
import RSA  = require('../Common/RSA');
import fs = require('fs');

get("/Packages/all", (req, res, next) => {
    var page = parseInt(req.param('page'));
    var ps = 10;
    Data.Models.Package.Table.find({}).order('-versionNo').limit(ps).offset((page - 1) * ps).run((err, packages)=> {
        if (err) return next(err);
        res.json(200, packages);
    });
});

post('/Packages/purchase/:version',  (req, res, next) => { // ===> app_sig
    var version = req.params.version;
    var router_uid = req.router.uid;
    var app_key = req.router.appkey;
    Data.Models.Package.Table.get(version, (err, pkg) => { // should be exist in DB
        if(err) return next(err);
        else {
            var salt = RSA.GenSalt(256);
            if(pkg.dirHashCode.trim() === '') {
                var app_path = path.join(ORBIT_CONF.PKG_BASE_PATH, pkg.version);
                pkg.dirHashCode =  HashDir(app_path, salt).toString("hex");
                pkg.save();
            }
            var pkg_sig = RSA.SignAppByHashCode(app_key, salt, pkg.dirHashCode); // sum per time.

            Data.Models.RouterApp.Table.find({version: version, router_uid: router_uid}, (err, routerApps)=> {
                if (err) return next(err);
                if (routerApps.length <= 0) {
                    var app_router_uid = UUIDstr();
                    Data.Models.RouterApp.Table.create({
                        uid: app_router_uid,
                        router_uid: router_uid,
                        version: version,
                        orderTime: new Date(),
                        installTime: new Date()
                    }, (err)=> {
                        if (err)
                            return next(err);
                        return res.json({pkg_sig: pkg_sig, app_router_uid: app_router_uid});
                    });
                } else {
                    return res.json({pkg_sig: pkg_sig, app_router_uid: routerApps[0].uid});
                }
            });
        }
    });
});

post('/Packages/download/:package_router_uid', (req, res, next) => {
    var package_router_uid = req.params.package_router_uid;
    var app_key = req.router.appkey;
    Data.Models.RouterPkg.Table.get(package_router_uid, (err, routerPkg)=> {
        if (err) return next(err);
        console.log('routerPkg', routerPkg);
        if (routerPkg) {
            var packagePath = path.join(ORBIT_CONF.PKG_BASE_PATH, routerPkg.pkg_version + '.zip');
            if(fs.existsSync(packagePath)) {
                console.log('packagePath'["cyanBG"].bold, packagePath);
                fs.createReadStream(packagePath).pipe(<any>res);
            } else {
                return next(new Error('.zip not exist on the server.'));
            }
        } else {
            return next(new Error('package does not exist.'));
        }
    });
});