var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Core = require("Core");
var child_process = require("child_process");
var Process = require("./Process");
var PPPStatus = (function () {
    function PPPStatus() {
    }
    PPPStatus.Offline = "Offline";
    PPPStatus.Online = "Online";
    return PPPStatus;
})();
exports.PPPStatus = PPPStatus;
var PPPoEDaemon = (function (_super) {
    __extends(PPPoEDaemon, _super);
    function PPPoEDaemon(account, passwd, pppNumber, opts) {
        var _this = this;
        _super.call(this, PPPoEDaemon.PPPD_NAME);
        this.status = PPPStatus.Offline;
        this.Apply = function (forever) {
            if (forever === void 0) { forever = true; }
            _this.Start(forever);
        };
        this.RegisterEvents();
        this.Account = account;
        this.Passwd = passwd;
        this.Options = opts;
        this.PPPNumber = pppNumber;
    }
    PPPoEDaemon.prototype.PPPStatus = function () {
        return this.status;
    };
    PPPoEDaemon.prototype.OnNewDevice = function (device) {
        if (device === "ppp" + this.PPPNumber) {
            info(device, PPPStatus.Online);
            this.status = PPPStatus.Online;
        }
    };
    PPPoEDaemon.prototype.OnDelDevice = function (device) {
        if (device === "ppp" + this.PPPNumber) {
            info(device, PPPStatus.Offline);
            this.status = PPPStatus.Offline;
        }
    };
    PPPoEDaemon.prototype.RegisterEvents = function () {
        Core.SubSys.Native.ip.Link.on("new", this.OnNewDevice).on("del", this.OnDelDevice);
    };
    PPPoEDaemon.prototype.RemoveEvents = function () {
        Core.SubSys.Native.ip.Link.removeListener("new", this.OnNewDevice).removeListener("del", this.OnDelDevice);
    };
    PPPoEDaemon.prototype.ConcatParams = function () {
        var params = ['unit', this.PPPNumber.toString(), 'plugin', PPPoEDaemon.RP_PPPOE_SO, 'nodetach'];
        for (var k in this.Options)
            params = params.concat([k, this.Options[k]]);
        return params;
    };
    PPPoEDaemon.prototype.Start = function (forever) {
        var _this = this;
        if (forever === void 0) { forever = true; }
        if (!this.IsChoking()) {
            if (this.Process) {
                this.Process.kill("SIGHUP");
                info("OK");
                _super.prototype.Start.call(this, forever);
            }
            else {
                killall(PPPoEDaemon.PPPD_NAME, function () {
                    _this.Process = child_process.spawn(PPPoEDaemon.PPPD_NAME, _this.ConcatParams());
                    _this.Process.stdout.on("data", function (data) {
                        info(data.toString());
                    });
                    info("OK");
                    _super.prototype.Start.call(_this, forever);
                });
            }
        }
    };
    PPPoEDaemon.prototype.Stop = function (restart) {
        if (restart === void 0) { restart = false; }
        this.RemoveEvents();
    };
    PPPoEDaemon.prototype.OnChoke = function () {
        var _this = this;
        _super.prototype.OnChoke.call(this);
        info("Killing all PPPD processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall(PPPoEDaemon.PPPD_NAME, function () {
            info("Done, waiting for recall");
            setTimeout(function () {
                _this.ClearChoke();
                _this.Start();
            }, 2000);
        });
        return true;
    };
    PPPoEDaemon.PPPD_NAME = "pppd";
    PPPoEDaemon.RP_PPPOE_SO = "/usr/lib/pppd/rp-pppoe.so";
    return PPPoEDaemon;
})(Process);
