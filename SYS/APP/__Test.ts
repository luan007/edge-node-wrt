import AppManager = require('./AppManager');

export function Initialize(cb) {
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