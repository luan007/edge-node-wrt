import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import DB = require('./DB');

export function Initialize(cb) {
    fatal('============>>> device: Graphd testing...');



    cb();
}
