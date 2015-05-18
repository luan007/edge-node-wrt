import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../Common/Stat/StatMgr');
import _StatNode = require('../../Common/Stat/StatNode');
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import Registry =  require('../../DB/Registry');

class Configuration extends Configurable {

    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);
    }

    _apply = (delta, original, cb) => {
        cb();
    }
}

var defaultConfig = {
    OBEXPush: {
        Enabled: true
    }
};

export function Initialize(cb) {
    var sub = Registry.Sector(Registry.RootKeys.FileSystem, "STORAGE");

    var configObex = new Configuration(SECTION.OBEX, defaultConfig);
    configObex.Initialize(cb);
}