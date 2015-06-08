import Storage = require("../Storage");
import validator = require("validator");
import Data = require("../Storage");
import path = require('path');
import RSA  = require('../Common/RSA');
import AES = require('../Common/AES');
import fs = require('fs');

get("/Packages/all/:page", (req, res, next) => {
    var page = parseInt(req.params.page);
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
            var aesPassword = AES.RandomPassword();
            //var salt = RSA.GenSalt(256);
            var pkg_sig = RSA.EncryptAESPassword(app_key, aesPassword); // sum per time.

            Data.Models.RouterPkg.Table.find({version: version, router_uid: router_uid}, (err, routerPkgs)=> {
                if (err) return next(err);
                if (routerPkgs.length <= 0) {
                    Data.Models.RouterPkg.Table.create({
                        router_uid: router_uid,
                        version: version,
                        password: aesPassword,
                        orderTime: new Date(),
                        installTime: new Date()
                    }, (err)=> {
                        if (err)
                            return next(err);
                        return res.json({pkg_sig: pkg_sig});
                    });
                } else {
                    return res.json({pkg_sig: pkg_sig});
                }
            });
        }
    });
});

post('/Packages/download/:version', (req, res, next) => {
    var version = req.params.version;
    var router_uid = req.router.uid;
    Data.Models.RouterPkg.Table.find({version: version, router_uid: router_uid}, (err, routerPkgs)=> {
        if (err) return next(err);
        if (routerPkgs.length > 0) {
            var routerPkg = routerPkgs[0];
            var packagePath = path.join(ORBIT_CONF.PKG_BASE_PATH, routerPkg.pkg_version + '.zip');
            if(fs.existsSync(packagePath)) {
                console.log('packagePath'["cyanBG"].bold, packagePath);
                try {
                    AES.EncryptFileSteram(packagePath, routerPkg.password).pipe(<any>res);
                } catch(err) {
                    return next(err);
                }
                //fs.createReadStream(packagePath).pipe(<any>res);
            } else {
                return next(new Error('.zip not exist on the server.'));
            }
        } else {
            return next(new Error('package does not exist.'));
        }
    });
});