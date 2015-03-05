import Core = require("Core");
import Node = require("Node");
import Native = Core.SubSys.Native;
import Samba = Core.SubSys.Native.smbd;
import Abstract = Core.Lib.Abstract;
import FS = Core.SubSys.FileSystem;
var smbInstance = FS.UserZone.Samba;
export var SambaInstance = smbInstance;

//TODO: add mdns support!

class Configuration extends Abstract.Configurable {

    Default = {
        Samba: {
            Enabled: true,
            Name: "edge",
            UseRouterName: false
        }
    };

    constructor() {
        super();
    }

    private _apply_samba = (mod, raw, cb) => {
        var reload = false;
        //TODO: check if this works
        if (has(mod, "Enabled")) {
            reload = true;
            smbInstance.Config.CommonSections["global"]["available"] = mod.Enabled ? Samba.YesOrNo.YES : Samba.YesOrNo.NO;
        }
        if (has(mod, "Name")) {
            if (!mod.UseRouterName && this.Get().Samba.UseRouterName) {
                reload = true;
                smbInstance.Config.CommonSections["global"]["Netbios_Name"] = mod.Name;
            }
        }
        if (has(mod, "UseRouterName")) {
            reload = true;
            if (!mod.UseRouterName) {
                smbInstance.Config.CommonSections["global"]["Netbios_Name"] = this.Get().Samba.Name;
            }
            else {
                smbInstance.Config.CommonSections["global"]["Netbios_Name"] =
                Core.Router.Network.Config.Get().NetworkName; //TODO: NetworkName should be changed into Self
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

    protected _apply = (mod, raw, cb: Callback) => {
        if (!raw || Object.keys(raw).length == 0) {
            return cb(); //nothing changed
        }
        var jobs = [];
        if (has(mod, "Samba")) {
            jobs.push(this._apply_samba.bind(this, mod.Samba, raw.Samba));
        }

        if (jobs.length == 0) return cb();
        async.series(jobs, cb);
    };

    public Initialize = (cb) => {
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.FileSystem, "STORAGE");
        this.Reload(this.Default, cb)
    };

}

export var Config = new Configuration();


export function Initialize(cb) {
    async.series([
        Config.Initialize
    ], cb);
}
