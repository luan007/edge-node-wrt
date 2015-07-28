import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import DB = require('./DB');

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.GRAPHD);
    sub.on('set', (graphd, oldValue, Status) => {
        if(Status.State) {
            if(Status.Error)
                console.log('DB status:'['redBG'].bold, graphd, Status.Error);
            else
                console.log('DB status:'['greenBG'].bold, graphd, Status.State);
        }
    });

    cb();
}

//export function Initialize(cb) {
//    console.log('============>>> device: Graphd testing...'['greenBG'].bold);

    //DB.RebuildDeltaV(()=> {
    //    var $type = 1;
    //    DB.QueryType($type, (err, res)=> {
    //        if (err) error(err);
    //        else console.log('============>>> device: Query By Type:'['greenBG'].bold, $type, res);
    //    });
    //    cb();
    //});

    //DB.RebuildDeltaV(()=> {
    //    var $query = {
    //        $and: [
    //            {type: 1},
    //            {
    //                tag: "vendor"
    //            }
    //        ]
    //    };
    //    DB.Find($query, (err, des) => {
    //        if (err) error(err);
    //        else console.log('============>>> device: Graphd result:'['greenBG'].bold, des);
    //        cb();
    //    });
    //
    //});

//     cb();
//}
