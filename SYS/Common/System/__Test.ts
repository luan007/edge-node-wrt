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
    PackageManager.Install(version, (err)=>{
        if(err) error('some error occurs:', err);
        else console.log('package installed, then upgrade SYSTEM...');
    });
}