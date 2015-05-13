import ConfMgr = require('../Common/Conf/ConfMgr');
import _Config = require('../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../Common/Stat/StatMgr');
import DeviceManager = require('./DeviceManager');

export function Initialize(cb) {
    fatal('============>>> device: CML testing...');

    var devices = DeviceManager.Devices();
    fatal('devices:', devices);

    cb();
}