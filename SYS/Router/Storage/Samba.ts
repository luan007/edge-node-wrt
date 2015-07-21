import Samba = require('../../Common/Native/smbd');
import SmbDaemon = Samba.SmbDaemon;
import SmbConfig = Samba.SmbConfig;
import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;

var smbInstance = new SmbDaemon(new SmbConfig());

class Configuration extends Configurable {

    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);
    }

    _apply = (delta, original, cb) => {
        var reload = false;
        //TODO: check if this works
        if (has(delta, "Enabled")) {
            reload = true;
            smbInstance.Config.CommonSections["global"]["available"] = delta.Enabled ? Samba.YesOrNo.YES : Samba.YesOrNo.NO;
        }
        if (has(delta, "Name")) {
            if (!delta.UseRouterName && this.Get().UseRouterName) {
                reload = true;
                smbInstance.Config.CommonSections["global"]["Netbios_Name"] = delta.Name;
            }
        }
        if (has(delta, "UseRouterName")) {
            reload = true;
            if (!delta.UseRouterName) {
                smbInstance.Config.CommonSections["global"]["Netbios_Name"] = this.Get().Name;
            }
            else {
                smbInstance.Config.CommonSections["global"]["Netbios_Name"] =
                    ConfMgr.Get(SECTION.NETWORK).NetworkName;
                //Core.Router.Network.Config.Get().NetworkName; //TODO: NetworkName should be changed into Self
            }
        }
        if (has(delta, "Folders")) {
            reload = true;
            for (var k in delta.Folders) {
                smbInstance.Config.Folders[k] = delta.Folders[k];
            }
        }
        if (reload) {
            smbInstance.Start(true);
            smbInstance.StabilityCheck(cb);
        }
        else {
            cb();
        }
    }
}

var defaultConfig = {
    Enabled: true,
    Name: "edge",
    UseRouterName: false,
    Folders: {
        Shared: {
            Guest_Ok: true,
            ReadOnly: false,
            Path: CONF.USER_DATA_PATH,
            Browseable: true,
            Comment: "Shared",
            Guest_Account: "nobody"
        }
    }
};

export function Initialize(cb) {
    info('[[[ Samba ]]] Initialize');
    var configSamba = new Configuration(SECTION.SAMBA, defaultConfig);
    configSamba.Initialize(cb);


    //TODO: Sub Network Name please
}

export function Diagnose(callback:Callback) {
    setTask('stability_check_samba', ()=> {
        smbInstance.StabilityCheck((err, stable)=> {
            if (err) return callback(err);
            return callback(null, stable);
        });
    }, 2000);
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.NETWORK);
    sub.network.on('NetworkName', (oldValue, newValue) => {
        var conf = ConfMgr.Get(SECTION.SAMBA) || defaultConfig;
        if(conf.UseRouterName){
            smbInstance.Config.CommonSections["global"]["Netbios_Name"] = newValue;
            smbInstance.Start(true);
        }
    });
    cb();
}