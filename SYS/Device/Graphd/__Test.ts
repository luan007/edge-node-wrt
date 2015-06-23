import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import DB = require('./DB');

export function Initialize(cb) {
    console.log('============>>> device: Graphd testing...'['greenBG'].bold);

    DB.RebuildDeltaV(()=> {
        var $query = {
            $and: [
                {type: 1},
                {
                    tag: "vendor"
                }
            ]
        };
        DB.Find($query, (err, des) => {
            if (err) error(err);
            else console.log('============>>> device: Graphd result:'['greenBG'].bold, des);
            cb();
        });

    });
}
