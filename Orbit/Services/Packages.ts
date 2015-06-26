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

post('/Packages/purchase/:version', (req, res, next) => { // ===> app_sig
    var version = req.params.version;
    var router_uid = req.router.uid;
    var app_key = req.router.appkey;
    Data.Models.Package.Table.get(version, (err, pkg) => { // should be exist in DB
        if (err) return next(err);
        else {
            var aesPassword = AES.RandomPassword();
            //var salt = RSA.GenSalt(64);
            AES.EncryptAESPassword(router_uid, aesPassword, app_key, (err, pkg_sig)=> {
                if (err) {
                    return console.log('Encrypt aes password error:'['yellowBG'].bold, err);
                }
                console.log('aes'['yellowBG'].bold, aesPassword, '\npkg_sig'['yellowBG'].bold, pkg_sig.toString('hex'));

                Data.Models.RouterPkg.Table.find({pkg_version: version, router_uid: router_uid}, (err, routerPkgs)=> {
                    if (err) return next(err);
                    if (routerPkgs.length <= 0) {
                        Data.Models.RouterPkg.Table.create({
                            router_uid: router_uid,
                            pkg_version: version,
                            password: aesPassword,
                            orderTime: new Date(),
                            installTime: new Date()
                        }, (err)=> {
                            if (err)
                                return next(err);
                            return res.json({pkg_sig: pkg_sig});
                        });
                    } else {
                        routerPkgs[0].password = aesPassword;
                        routerPkgs[0].orderTime = new Date();
                        routerPkgs[0].installTime = new Date();
                        routerPkgs[0].save((err)=> {
                            if (err)
                                return next(err);
                            return res.json({pkg_sig: pkg_sig});
                        });
                    }
                });
            });
        }
    });
});

post('/Packages/download/:version', (req, res, next) => {
    var version = req.params.version;
    var router_uid = req.router.uid;
    Data.Models.RouterPkg.Table.find({pkg_version: version, router_uid: router_uid}, (err, routerPkgs)=> {
        if (err) return next(err);
        if (routerPkgs.length > 0) {
            var routerPkg = routerPkgs[0];
            var packagePath = path.join(ORBIT_CONF.PKG_BASE_DIR, routerPkg.pkg_version + '.zip');
            if (fs.existsSync(packagePath)) {
                console.log('packagePath'["cyanBG"].bold, packagePath);
                try {
                    var streamingProcess = AES.EncryptFileProcess(packagePath, routerPkg.password);
                    streamingProcess.stderr.on('data', (data) => {
                        console.log('openssl stderr:'['yellowBG'].bold, data.toString());
                    });
                    streamingProcess.stdout.pipe(<any>res);
                } catch (err) {
                    return next(err);
                }
                //fs.createReadStream(packagePath).pipe(<any>res);
            } else {
                return next(new Error('.zip does not exist on the server.'));
            }
        } else {
            return next(new Error('package does not exist.'));
        }
    });
});

get('/Packages/graphd/version', (req, res, next) => {
    Data.Models.Graphd.Graphd.table().one({name: 'graphd'}, (err, graphd) => { // { name: 'graphd', numericDate: '201506251530'
        if (err) return next(err);
        res.json(200, {numericDate: graphd.numericDate});
    });
});

post('/Packages/graphd/purchase', (req, res, next) => {
    var router_uid = req.router.uid;
    var app_key = req.router.appkey;
    console.log('graphd', '[1]');
    Data.Models.Graphd.Table.get('graphd', (err, result) => {
        if (err) return next(err);
        console.log('graphd', '[2]');

        var numericDate = result.numericDate;
        Data.Models.RouterGraphd.Table.one({router_uid: router_uid}, (err2, record) => { // should be exist in DB
            if (err2) return next(err2);
            console.log('graphd', '[3]');

            var upgrade = record ? true : false;
            var data = <any>{};
            data.router_uid = router_uid;
            data.numericDate = numericDate;
            data.password = AES.RandomPassword();
            data.orderTime = new Date();

            AES.EncryptAESPassword(router_uid, data.password, app_key, (err3, pkg_sig)=> { // encrypt aes password
                if (err3) return next(err3);
                console.log('graphd', '[4]');

                if (upgrade) {
                    record.save(data, (err4)=> {
                        if (err4) return next(err4);
                        return res.json({numericDate: numericDate, pkg_sig: pkg_sig});
                    });
                } else {
                    Data.Models.RouterGraphd.Table.create(data, (err4)=> {
                        if (err4) return next(err4);
                        return res.json({numericDate: numericDate, pkg_sig: pkg_sig});
                    });
                }
            });

        });
    });
});

post('/Packages/graphd/download', (req, res, next) => {
    var router_uid = req.router.uid;

    if (!fs.existsSync(ORBIT_CONF.GRAPHD_PACKAGE_LOCATION)) {
        return next(new Error('.zip does not exist on the server.'));
    } else {
        try {
            Data.Models.RouterGraphd.Table.get(router_uid, (err, routerGraphd)=> {
                if (err) return next(err);
                if (!routerGraphd)
                    return next(new Error('package does not exist.'));
                if (!fs.existsSync(ORBIT_CONF.GRAPHD_PACKAGE_LOCATION))
                    return next(new Error('.zip does not exist on the server.'));
                try {
                    var streamingProcess = AES.EncryptFileProcess(ORBIT_CONF.GRAPHD_PACKAGE_LOCATION, routerGraphd.password);
                    streamingProcess.stderr.on('data', (data) => {
                        console.log('openssl stderr:'['yellowBG'].bold, data.toString());
                    });
                    streamingProcess.stdout.pipe(<any>res);
                } catch (err) {
                    return next(err);
                }
            });
        } catch (err) {
            return next(err);
        }
    }
});