import PackageManager = require('./PackageManager');
import StatMgr = require('../Stat/StatMgr');
import _StatNode = require('../Stat//StatNode');
import StatNode = _StatNode.StatNode;

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
    if(fs.existsSync(pkgPath)){
        console.log('package exists.'['cyanBG'].bold, pkgPath);
        return cb();
    } else {
        PackageManager.Install(version, (err)=> {
            if (err) error('some error occurs:', err);
            else console.log('package installed, then upgrade SYSTEM...');
            return cb();
        });
    }
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.PKG);
    sub.pkgs.on('set', (version, oldValue, status)=> {
        console.log('========[[ Package set'["cyanBG"].bold, version, status.Error ? status.Error : status.State);
    });
    sub.pkgs.on('del', (version)=> {
        console.log('========[[ Package delete'["cyanBG"].bold, version);
    });
    cb();
}