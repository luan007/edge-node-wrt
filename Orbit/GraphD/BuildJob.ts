import DB = require('./DB');
import fs = require('fs');
import child_process = require('child_process');

var jobs = [];
jobs.push((cb)=> {
    if (fs.existsSync(ORBIT_CONF.GRAPHD_BASE_PATH)) {
        child_process.exec('rm -rf ' + ORBIT_CONF.GRAPHD_BASE_PATH, (error, stdout, stderr)=> {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('delete error: ' + ORBIT_CONF.GRAPHD_BASE_PATH, error);
            }

            return cb(error);
        });
    } else {
        return cb();
    }
});

jobs.push((cb)=>{
    DB.RebuildDeltaV(()=> {

        cb();
    });
});

async.series(jobs, (err)=>{
    if(err) console.log('rebuilding job err:', err);
    else console.log('rebuilding success.');
});
