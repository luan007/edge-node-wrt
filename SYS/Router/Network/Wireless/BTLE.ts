import _hcitool = require('../../../Common/Native/hcitool');
import HCITool = _hcitool.HCITool;
import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;

var hcitoolInstance = new HCITool();

var pub = StatMgr.Pub(SECTION.BTLE, {
    devices: {}
});

class Configuration extends Configurable {
    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);
    }

    protected _apply = (mod, raw, cb:Callback) => {
        hcitoolInstance.Start(true);
        cb();
    }
}

var defaultConfig = {
}

export function Initialize(cb) {
    var configBluez = new Configuration(SECTION.BTLE, defaultConfig);
    configBluez.Initialize(cb);

    hcitoolInstance.on("UP", (mac, name) => {
        pub.devices.Set(mac, name);
    });
}