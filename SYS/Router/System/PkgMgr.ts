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

export function AvaliablePkgs(page, callback){
    Orbit.Get('Packages/all/'+ page, {}, (err, pkgs:IPackage)=> {
        if(err) return callback(err);
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

        var pkgExtractedPath = "";
        var pkgPath = path.join(CONF.PKG_TMP_PATH, version + '.zip');
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
                    State: 'extracting'
                });

                pkgExtractedPath = path.join(CONF.PKG_TMP_PATH, version);
                fs.createReadStream(pkgPath)
                    .pipe(unzip.Extract({path:pkgExtractedPath}))
                    .on('error', (err)=> {
                        error(err);
                        pub.pkgs.Set(version, {
                            State: 'error',
                            Error: err
                        });
                        return callback(err);
                    })
                    .on("close", () => {
                        pub.pkgs.Set(version, {
                            State: 'verifying'
                        });
                        var api_salt = orbitResult.pkg_sig.substr(0, 512) ,
                            sig = orbitResult.pkg_sig.substring(512);
                        _check(pkgExtractedPath, api_salt, sig, (err, success) => {
                            if(err) {
                                pub.pkgs.Set(version, {
                                    State: 'error',
                                    Error: err
                                });
                                return callback(err);
                            }
                            if(!success){
                                pub.pkgs.Set(version, {
                                    State: 'failed'
                                });
                                return callback(new Error('pkg verify failed.'));
                            }
                            //upgrade SYSTEM
                            fs.writeFile(CONF.PKG_UPGRADE_PATH, pkgExtractedPath, (err)=>{
                                if(err){
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