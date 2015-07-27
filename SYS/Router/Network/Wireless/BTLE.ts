import _noble = require("../../../Common/Native/noble");
import Noble = _noble.Noble;
import NobleMessage = _noble.Emitter;
import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;

var pub = StatMgr.Pub(SECTION.BTLE, {
    devices: {}
});

//class Configuration extends Configurable {
//    constructor(moduleName:string, defaultConfig:any) {
//        super(moduleName, defaultConfig);
//    }
//
//    protected _apply = (mod, raw, cb:Callback) => {
//        hcitoolInstance.Start(true);
//        cb();
//    }
//}
//
//var defaultConfig = {
//}

export function Initialize(cb) {
    //var configBluez = new Configuration(SECTION.BTLE, defaultConfig);
    //configBluez.Initialize(cb);
    NobleMessage.on("UP", (address, device)=>{
        pub.devices.Set(address, JSON.parse(JSON.stringify(device)));
    });

    NobleMessage.on("CHANGE", (address, device)=>{
        pub.devices.Set(address, JSON.parse(JSON.stringify(device)));
    });

    NobleMessage.on("DOWN", (address)=>{
        pub.devices.Del(address);
    });

    cb();
}

__API(_noble.Write, "Edge.Wireless.BTLE.Write", [Permission.DeviceAccess]);
__API(_noble.Read, "Edge.Wireless.BTLE.Read", [Permission.DeviceAccess]);
__API(_noble.RSSI, "Edge.Wireless.BTLE.RSSI", [Permission.DeviceAccess]);