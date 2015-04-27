//import Core = require("Core");
//import Node = require("Node");
//import Native = Core.SubSys.Native;
//import Samba = Core.SubSys.Native.smbd;
//import Abstract = Core.Lib.Abstract;
//import FS = Core.SubSys.FileSystem;
//
//class Configuration extends Abstract.Configurable {
//
//    Default = {
//        OBEXPush: {
//            Enabled: true
//        }
//    };
//
//    constructor() {
//        super();
//    }
//
//    private _apply_obexd = (mod, raw, cb) => {
//    }
//
//    public Initialize = (cb) => {
//        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.FileSystem, "STORAGE");
//        this.Reload(this.Default, cb)
//    };
//}
//
//export var Config = new Configuration();
//
//export function Initialize(cb) {
//    async.series([
//        Config.Initialize
//    ], cb);
//}