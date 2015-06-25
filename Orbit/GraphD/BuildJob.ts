process.env.ROOT_PATH = path.join(__dirname, '../');
process.env.NODE_PATH = path.join(__dirname, '../');

import fs = require('fs');
import path = require('path');
import child_process = require('child_process');
import DB = require('./DB');
import Data = require("../Storage");

var jobs = [];
jobs.push((cb)=> { // 1. delete old verseion
    if (fs.existsSync(ORBIT_CONF.GRAPHD_LOCATION)) {
        child_process.exec('rm -rf ' + ORBIT_CONF.GRAPHD_LOCATION, (error, stdout, stderr)=> {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('delete error: ' + ORBIT_CONF.GRAPHD_LOCATION, error);
            }

            return cb(error);
        });
    } else {
        return cb();
    }
});

jobs.push((cb)=>{
    DB.RebuildDeltaV((err)=> { // 2. rebuild & pack
        if(err) return cb(err);

        var graphdPackage = path.join(ORBIT_CONF.PKG_BASE_PATH, 'graphd.zip');
        child_process.exec('zip -j ' + graphdPackage + ' ' + ORBIT_CONF.GRAPHD_LOCATION, (error, stdout, stderr)=> {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('delete error: ' + ORBIT_CONF.GRAPHD_LOCATION, error);
            }

            return cb(error);
        });
        cb();
    });
});

function _two_digit(number:Number) {
    return (number < 10 ? '0' + number.toString() : number.toString());
}

function _numeric_date(date:Date) {
    var str = date.getFullYear() + _two_digit(date.getMonth() + 1) + _two_digit(date.getDate());
    return Number(str);
}

jobs.push((cb)=>{ // 3. update DB record
    var numeric_date = _numeric_date(new Date());
    Data.Models.Graphd.Table.one({ name: 'graphd'}, (err, result) => {
        var upgrade = false;
        var data = <any>{};
        if (!err && result) {
            upgrade = true;
        }
        data.name = 'graphd';
        data.numeric_date = numeric_date;
        if (upgrade) {
            console.log("Upgrading graphd", numeric_date);
            result.save(data, cb);
        } else {
            console.log("Saving graphd ", numeric_date);
            Data.Models.Graphd.Table.create(data, cb);
        }
    });
});

async.series(jobs, (err)=>{
    if(err) console.log('rebuilding job err:', err);
    else console.log('rebuilding success.');
});
