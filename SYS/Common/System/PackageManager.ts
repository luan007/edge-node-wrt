import Storage = require('../../DB/Storage');
import StatMgr = require('../../Common/Stat/StatMgr');
import _StatNode = require('../../Common/Stat/StatNode');
import StatNode = _StatNode.StatNode;
import http = require('http');
import fs = require('fs');
import path = require('path');
var unzip = require("unzip");

var packgeJSONPath = path.join(process.env.ROOT_PATH, 'package.json');

var pub = StatMgr.Pub(SECTION.PKG, {
    pkgs: {}
});

export function CurrentVersion() {
    var json = fs.readFileSync(packgeJSONPath);
    var packageInfo = JSON.parse(json.toString());
    return packageInfo.version;
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
    Orbit.Get('Packages/all/' + page, {}, (err, pkgs)=> {
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
    try {
        var currentVerNo = GetVersionNo(CurrentVersion());
        var versionNo = GetVersionNo(version);
        if (versionNo <= currentVerNo) {
            return callback(new Error("Current version is newer."));
        }
    } catch (err) {
        return callback(err);
    }

    Purchase(version, (err, orbitResult) => {
        if (err) {
            error(err);
            return callback(err);
        }

        console.log('pkg_sig'['yellowBG'].bold, orbitResult.pkg_sig.toString('hex'));

        fs.writeFile(CONF.PKG_UPGRADE_PASSWORD_FILE, orbitResult.pkg_sig, {encoding: 'binary'}, (err)=> { //save password
            if (err) {
                error(err);
                pub.pkgs.Set(version, {
                    State: 'error',
                    Error: err
                });
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
                        callback(null);
                        console.log('System exit...'['yellowBG'].bold);
                        process.nextTick(()=> {
                            process.exit(0); // O_O
                        });
                    });
                });
        });
    });
}