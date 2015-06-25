import path = require('path');
process.env.ROOT_PATH = path.join(__dirname, '../');
process.env.NODE_PATH = path.join(__dirname, '../');

require('../Env');

import Data = require("../Storage");
import DB = require('./DB');
import Util =require('../Common/Util');

var jobs = [];

jobs.push((cb)=>{ // 0. init DB
    console.log(" [0] INIT DB");
    Data.Initialize("root:system@localhost/edge", cb);
});

jobs.push((cb)=> { // 1. delete old verseion
    if (fs.existsSync(ORBIT_CONF.GRAPHD_DIR)) {
        child_process.exec('rm -rf ' + ORBIT_CONF.GRAPHD_DIR, (error, stdout, stderr)=> {
            if (error !== null) {
                console.log('delete error: ' + ORBIT_CONF.GRAPHD_DIR, error);
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

        var cmd = 'zip -j ' + ORBIT_CONF.GRAPHD_PACKAGE_LOCATION + ' ' + ORBIT_CONF.GRAPHD_DIR + '/*';
        console.log('executing command', cmd);
        child_process.exec(cmd, (error, stdout, stderr)=> {
            if (error !== null) {
                console.log('rebuilding error: ' + ORBIT_CONF.GRAPHD_DIR, error);
            }

            return cb(error);
        });
        cb();
    });
});

jobs.push((cb)=>{ // 3. update DB record
    var numeric_date = Util.NumericDateTime(new Date());
    Data.Models.Graphd.Table.one({ name: 'graphd'}, (err, result) => {
        var upgrade = false;
        var data = <any>{};
        if (!err && result) {
            upgrade = true;
        }
        data.name = 'graphd';
        data.numericDate = numeric_date.toString();
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
