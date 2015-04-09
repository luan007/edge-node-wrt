var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fs = require("fs");
var child_process = require("child_process");
var Process = require("./Process");
var _ = require("underscore");
;
var YesOrNo = (function () {
    function YesOrNo() {
    }
    YesOrNo.YES = "YES";
    YesOrNo.NO = "NO";
    return YesOrNo;
})();
exports.YesOrNo = YesOrNo;
var SmbConfServerRole = (function () {
    function SmbConfServerRole() {
    }
    SmbConfServerRole.AUTO = "AUTO";
    SmbConfServerRole.STANDALONE = "STANDALONE";
    SmbConfServerRole.MEMBER_SERVER = "MEMBER SERVER";
    SmbConfServerRole.CLASSIC_PRIMARY_DOMAIN_CONTROLLER = "CLASSIC PRIMARY DOMAIN CONTROLLER";
    SmbConfServerRole.NETBIOS_BACKUP_DOMAIN_CONTROLLER = "NETBIOS BACKUP DOMAIN CONTROLLER";
    SmbConfServerRole.ACTIVE_DIRECTORY_DOMAIN_CONTROLLER = "ACTIVE DIRECTORY DOMAIN CONTROLLER";
    return SmbConfServerRole;
})();
exports.SmbConfServerRole = SmbConfServerRole;
var SmbConfMap2Guest = (function () {
    function SmbConfMap2Guest() {
    }
    SmbConfMap2Guest.Never = "Never";
    SmbConfMap2Guest.Bad_User = "Bad User";
    SmbConfMap2Guest.Bad_Password = "Bad Password";
    SmbConfMap2Guest.Bad_Uid = "Bad Uid";
    return SmbConfMap2Guest;
})();
exports.SmbConfMap2Guest = SmbConfMap2Guest;
var SmbConfig = (function () {
    function SmbConfig(commonSections) {
        var _this = this;
        this.ToConf = function () {
            var newConf = "";
            var util = require("util");
            var conf = _this.Normalize();
            for (var topKey in _this) {
                for (var sectionName in conf[topKey]) {
                    newConf += util.format("[%s]\n", sectionName);
                    for (var k in conf[topKey][sectionName]) {
                        newConf += util.format("\t%s = %s\n", k.replace(/_/g, ' '), conf[topKey][sectionName][k]);
                    }
                }
            }
            return newConf;
        };
        this.Folders = {};
        this.Printers = {};
        this.CommonSections = commonSections || {
            "global": {
                "Available": YesOrNo.YES,
                "Follow_Symlinks": YesOrNo.NO,
                "Wide_Links": YesOrNo.NO,
                "Use_SendFile": YesOrNo.YES,
                "Read_Raw": YesOrNo.YES,
                "Write_Raw": YesOrNo.YES,
                "Write_Cache_Size": 262144,
                "Large_Readwrite": YesOrNo.YES,
                "Workgroup": "WORKGROUP",
                "Local Master": YesOrNo.YES,
                "Preferred Master": YesOrNo.YES,
                "OS Level": 200,
                "Server_String": "Edge Server",
                "Guest_Account": "nobody",
                "Netbios_Name": "edge",
                "Dns_Proxy": YesOrNo.NO,
                "Server_Role": SmbConfServerRole.STANDALONE,
                "Map_To_Guest": SmbConfMap2Guest.Bad_User,
            },
            "printers": {
                "Comment": "All printers",
                "Path": "/var/spool/samba",
                "Create_Mask": "0700",
                "Printable": YesOrNo.YES,
                "Browseable": YesOrNo.YES
            },
            "print$": {
                "Comment": "Printer Drivers",
                "Path": "/var/lib/samba/printers"
            }
        };
    }
    SmbConfig.prototype.Normalize = function () {
        var conf = _.clone(this);
        var netbiosName = conf.CommonSections["global"]["Netbios_Name"].replace(/ /gi, "_"), len = netbiosName.length;
        if (netbiosName) {
            conf.CommonSections["global"]["Netbios_Name"] = (len > 15 ? netbiosName.substr(0, 15) : netbiosName);
        }
        return conf;
    };
    return SmbConfig;
})();
exports.SmbConfig = SmbConfig;
var SmbDaemon = (function (_super) {
    __extends(SmbDaemon, _super);
    function SmbDaemon(config, outputLevel) {
        var _this = this;
        if (outputLevel === void 0) { outputLevel = 3; }
        _super.call(this, SmbDaemon.SMBD_NAME);
        this._path_conf = getSock(UUIDstr());
        this.Apply = function (forever) {
            if (forever === void 0) { forever = true; }
            _this.Start(forever);
        };
        if (CONF.IS_DEBUG && CONF.DISABLE_SAMBA) {
            this.BypassStabilityTest = true;
        }
        this.Config = config;
        this.OutputLevel = outputLevel;
    }
    SmbDaemon.prototype.Start = function (forever) {
        var _this = this;
        if (forever === void 0) { forever = true; }
        if (CONF.IS_DEBUG && CONF.DISABLE_SAMBA)
            return;
        if (!this.IsChoking()) {
            var changed = false;
            var conf = this.Config.ToConf();
            if (didChange(this._path_conf, conf)) {
                if (fs.existsSync(this._path_conf) && fs.unlinkSync(this._path_conf))
                    ;
                fs.writeFileSync(this._path_conf, this.Config.ToConf());
                changed = true;
            }
            if (this._ad1) {
                this._ad1.stop();
                this._ad1 = undefined;
            }
            if (this._ad2) {
                this._ad2.stop();
                this._ad2 = undefined;
            }
            if (this.Config.CommonSections["global"]["Available"] === YesOrNo.YES) {
                this._ad1 = mdns.createAdvertisement(mdns.tcp('smb'), 445, {
                    name: this.Config.CommonSections["global"]["Netbios_Name"]
                });
                this._ad1.start();
                this._ad2 = mdns.createAdvertisement(mdns.tcp('device-info'), 0, {
                    name: this.Config.CommonSections["global"]["Netbios_Name"],
                    txtRecord: {
                        model: "AirPort"
                    }
                });
                this._ad2.start();
            }
            if (this.Process) {
                if (changed) {
                    this.Process.kill("SIGHUP");
                    info("OK");
                    this.RestartNMDB();
                    _super.prototype.Start.call(this, forever);
                }
                else {
                    info("No change, skipped");
                }
            }
            else {
                killall(SmbDaemon.SMBD_NAME, function () {
                    _this.Process = child_process.spawn(SmbDaemon.SMBD_NAME, [
                        "-F",
                        "--log-stdout",
                        "-s=" + _this._path_conf,
                        "-d=" + _this.OutputLevel
                    ], {
                        stdio: ['ignore', 'ignore', 'ignore']
                    });
                    info("OK");
                    _this.RestartNMDB();
                    _super.prototype.Start.call(_this, forever);
                });
            }
        }
    };
    SmbDaemon.prototype.Stop = function (restart) {
        if (restart === void 0) { restart = false; }
        if (this._ad1) {
            this._ad1.stop();
            this._ad1 = undefined;
        }
        if (this._ad2) {
            this._ad2.stop();
            this._ad2 = undefined;
        }
        this.KillNMDB(_super.prototype.Stop.bind(null, restart));
    };
    SmbDaemon.prototype.RestartNMDB = function () {
        var _this = this;
        this.KillNMDB(function () {
            exec(SmbDaemon.NMDB_NAME, "-s=" + _this._path_conf);
        });
    };
    SmbDaemon.prototype.KillNMDB = function (cb) {
        killall(SmbDaemon.NMDB_NAME, cb);
    };
    SmbDaemon.prototype.OnChoke = function () {
        var _this = this;
        _super.prototype.OnChoke.call(this);
        info("Killing all SMBD processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall(SmbDaemon.SMBD_NAME, function () {
            _this.KillNMDB(function () {
                info("Done, waiting for recall");
                _this.Choke_Timer = setTimeout(function () {
                    _this.ClearChoke();
                    _this.Start();
                }, 2000);
            });
        });
        return true;
    };
    SmbDaemon.SMBD_NAME = "smbd";
    SmbDaemon.NMDB_NAME = "nmbd";
    return SmbDaemon;
})(Process);
exports.SmbDaemon = SmbDaemon;
