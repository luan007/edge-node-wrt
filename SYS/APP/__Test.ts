import AppManager = require('./AppManager');

export function Initialize(cb) {
    //Orbit.Get('App/all', {},  (err, result) => {
    //    if(err) error(err);
    //    console.log('Retrieved app list:'.bold["greenBG"], '\n', result);
    //    cb();
    //});

    AppManager.Install('TestApp', (err) => {
        if(err) error(err);
        else {
            info('Install successfully.');
            AppManager.UnInstall('TestApp', (err)=> {
                if(err) error(err);
                else {
                    info('UnInstall successfully.');
                }
            });
        }
    });
}