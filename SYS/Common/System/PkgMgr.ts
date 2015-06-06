import Storage = require('../../DB/Storage');
import _Package = require('../../DB/Models/Package');
import Package = _Package.Package;
import IPackage = _Package.IPackage;
import StatMgr = require('../../Common/Stat/StatMgr');
import _StatNode = require('../../Common/Stat/StatNode');
import StatNode = _StatNode.StatNode;
import http = require('http');
var unzip = require("unzip");

var pub = StatMgr.Pub(SECTION.PKG, {
    pkgs: {}
});


export function CurrentVersion(cb) {
    Package.table().one({}, (err, pkg) => {
        if (err) return cb(err);
        return cb(null, pkg.versionNo);
    });
}

export function GetVersionNo(version) {
    var verNo = 0;
    var parts = version.split('.');
    if (parts.length < 3)
        throw new Error('illegal version.');
    for (var i = 0; i < 3; i++) {
        verNo += parseInt(parts[i]) * Math.pow(10, 3 * (2 - i));
    }
    return verNo;
}

export function AvaliablePkgs(page, callback) {
    Orbit.Get('Packages/all/' + page, {}, (err, pkgs:IPackage)=> {
        if (err) return callback(err);
        return callback(null, pkgs);
    });
}

/**
 * Purchase PKG
 */
export function Purchase(version:string, callback:Callback) {
    Orbit.Post('Packages/purchase/' + version, {}, (err, orbitResult)=> {
        if (err) return callback(err);
        try {
            pub.pkgs.Set(version, {
                State: 'purchasing'
            });
            return callback(null, orbitResult);
        } catch (err) {
            pub.pkgs.Set(version, {
                State: 'error',
                Error: err
            });
            return callback(err);
        }
    });
}

/**
 * Install PKG
 * @param version
 * @param callback
 * @constructor
 */
export function Install(version, callback) {
    Purchase(version, (err, orbitResult) => {
        if (err) {
            error(err);
            return callback(err);
        }

        var pkgPath = path.join(CONF.PKG_TMP_DIR, version + '.zip');
        if (fs.existsSync(pkgPath))
            fs.unlinkSync(pkgPath);
        var pkgStream = fs.createWriteStream(pkgPath);

        pub.pkgs.Set(version, {
            State: 'downloading'
        });

        Orbit.Download('Packages/download/' + version, {}, (err, stream)=> {
            if (err) {
                pub.pkgs.Set(version, {
                    State: 'error',
                    Error: err
                });
                return callback(err);
            }

            stream.pipe(pkgStream);
        });
        pkgStream
            .on('error', (err)=> {
                pub.pkgs.Set(version, {
                    State: 'error',
                    Error: err
                });
                error(err);
                return callback(err);
            })
            .on('finish', ()=> {
                pub.pkgs.Set(version, {
                    State: 'saving'
                });

                fs.writeFile(CONF.PKG_LATEST_PASSWORD_FILE, orbitResult.pkg_sig, (err)=> { //save password
                    if (err) {
                        error(err);
                        pub.pkgs.Set(version, {
                            State: 'error',
                            Error: err
                        });
                        return callback(err);
                    }
                    //upgrade SYSTEM
                    fs.writeFile(CONF.PKG_UPGRADE_FILE, pkgPath, (err)=> { // write pkg path
                        if (err) {
                            error(err);
                            pub.pkgs.Set(version, {
                                State: 'error',
                                Error: err
                            });
                            return callback(err);
                        }
                        pub.pkgs.Set(version, {
                            State: 'upgrading'
                        });
                        process.exit(0); // O_O
                    });
                });
            });
    });
}

function _check(target_dir, api_salt, sig, cb) {
    if (CONF.IS_DEBUG && CONF.BYPASS_APP_SIGCHECK) {
        warn("!!Sigcheck Bypassed!!");
        return cb(undefined, true);
    }
    try {
        var salt = new Buffer(api_salt, "hex");
        var hash = HashDir(target_dir, salt);
        var snapshot = salt.toString("hex") + hash.toString("hex");
        //fatal('[[[ ========= snapshot [[[ ', snapshot);
        //fatal('[[[ ========= api_salt [[[ ', api_salt);
        //fatal('[[[ ========= sig [[[ ', sig);
        return cb(undefined, RSA_Verify("App", sig, snapshot));
    } catch (e) {
        return cb(e, false);
    }
};