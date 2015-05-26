import AppManager = require('./AppManager');

export function Initialize(cb) {
    Orbit.Get('App/all', {},  (err, result) => {
        if(err) error(err);
        console.log('[[[ ============= [[[ app list:\n', result);
        cb();
    });
}