var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Core = require("Core");
var Samba = Core.SubSys.Native.smbd;
var Abstract = Core.Lib.Abstract;
var FS = Core.SubSys.FileSystem;
var smbInstance = FS.UserZone.Samba;
exports.SambaInstance = smbInstance;
var Configuration = (function (_super) {
    __extends(Configuration, _super);
    function Configuration() {
        var _this = this;
        _super.call(this);
        this.Default = {
            Samba: {
                Enabled: true,
                Name: "edge",
                UseRouterName: false
            },
            OBEXPush: {
                Enabled: true
            }
        };
        this._apply_obexd = function (mod, raw, cb) {
        };
        this._apply_samba = function (mod, raw, cb) {
            var reload = false;
            if (has(mod, "Enabled")) {
                reload = true;
                smbInstance.Config.CommonSections["global"]["available"] = mod.Enabled ? Samba.YesOrNo.YES : Samba.YesOrNo.NO;
            }
            if (has(mod, "Name")) {
                if (!mod.UseRouterName && _this.Get().Samba.UseRouterName) {
                    reload = true;
                    smbInstance.Config.CommonSections["global"]["Netbios_Name"] = mod.Name;
                }
            }
            if (has(mod, "UseRouterName")) {
                reload = true;
                if (!mod.UseRouterName) {
                    smbInstance.Config.CommonSections["global"]["Netbios_Name"] = _this.Get().Samba.Name;
                }
                else {
                    smbInstance.Config.CommonSections["global"]["Netbios_Name"] = Core.Router.Network.Config.Get().NetworkName;
                }
            }
            if (reload) {
                smbInstance.Start(true);
                smbInstance.StabilityCheck(cb);
            }
            else {
                cb();
            }
        };
        this._apply = function (mod, raw, cb) {
            if (!raw || Object.keys(raw).length == 0) {
                return cb();
            }
            var jobs = [];
            if (has(mod, "Samba")) {
                jobs.push(_this._apply_samba.bind(_this, mod.Samba, raw.Samba));
            }
            if (jobs.length == 0)
                return cb();
            async.series(jobs, cb);
        };
        this.Initialize = function (cb) {
            _this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.FileSystem, "STORAGE");
            _this.Reload(_this.Default, cb);
        };
    }
    return Configuration;
})(Abstract.Configurable);
exports.Config = new Configuration();
function Initialize(cb) {
    async.series([
        exports.Config.Initialize
    ], cb);
}
exports.Initialize = Initialize;
