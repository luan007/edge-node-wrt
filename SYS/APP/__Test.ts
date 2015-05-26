import AppManager = require('./AppManager');

export function Initialize(cb) {
    Orbit.Get('App/all', {},  (err, result) => {
        if(err) error(err);
        console.log('Retrieved app list:'.bold["greenBG"], '\n', result);
        cb(); 
    });
}