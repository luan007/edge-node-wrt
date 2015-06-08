import PackageManager = require('./PackageManager');

export function Initialize(cb) {
    //PackageManager.AvaliablePkgs(1, (err, pkgs)=> {
    //    if (err) error(err);
    //    else {
    //        pkgs.forEach((pgk:any)=> {
    //            console.log('Package version: ', pgk.version);
    //        });
    //    }
    //    cb();
    //});

    var version = '1.0.0';
    var pkgPath = path.join(CONF.PKG_TMP_DIR, version + '.zip');
    console.log('package exists.'['cyanBG'].bold, pkgPath);
    if(fs.existsSync(pkgPath)){
        return cb();
    } else {
        PackageManager.Install(version, (err)=> {
            if (err) error('some error occurs:', err);
            else console.log('package installed, then upgrade SYSTEM...');
            return cb();
        });
    }
}