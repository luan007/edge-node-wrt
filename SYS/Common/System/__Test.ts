import PackageManager = require('./PackageManager');

export function Initialize(cb) {
    PackageManager.AvaliablePkgs(1, (err, pkgs)=> {
        if (err) error(err);
        else {
            pkgs.forEach((pgk:any)=> {
                console.log('Package version: ', pgk.version);
            });
        }
        cb();
    });
}