import path = require('path');
process.env.ROOT_PATH = path.join(__dirname, '../');
process.env.NODE_PATH = path.join(__dirname, '../');

require('../Env');

import Data = require("../Storage");
import DB = require('./DB');

var jobs = [];

jobs.push((cb)=>{ // 0. init DB
    console.log(" [0] INIT DB");
    Data.Initialize("root:system@localhost/edge", cb);
});

jobs.push((cb)=> { // 1. delete old verseion
    if (fs.existsSync(ORBIT_CONF.GRAPHD_LOCATION)) {
        child_process.exec('rm -rf ' + ORBIT_CONF.GRAPHD_LOCATION, (error, stdout, stderr)=> {
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
        var cmd = 'zip -j ' + graphdPackage + ' ' + ORBIT_CONF.GRAPHD_LOCATION + '/*';
        console.log('executing command', cmd);
        child_process.exec(cmd, (error, stdout, stderr)=> {
            if (error !== null) {
                console.log('rebuilding error: ' + ORBIT_CONF.GRAPHD_LOCATION, error);
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
    Data.Models.Graphd.Graphd.table().one({ name: 'graphd'}, (err, result) => {
        var upgrade = false;
        var data = <any>{};
        if (!err && result) {
            upgrade = true;
        }
        data.name = 'graphd';
        data.numericDate = numeric_date;
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
    if(err) {
        console.log('rebuilding job err:'['redBG'].bold, err);
        process.exit(1);
    }
    else {
        console.log('rebuilding success.'['cyanBG'].bold);
        process.exit(0);
    }
});
