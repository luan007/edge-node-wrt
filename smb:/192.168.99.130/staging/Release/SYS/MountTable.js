var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var child_process = require('child_process');
var path = require('path');
var APIConfig = require('./APIConfig');
var Process = require("../System/SubSys/Native/Process");
var MountTable = (function () {
    function MountTable() {
    }
    MountTable.MountNew = function (moduleName, modulePath, socketPath) {
        MountTable.mapping[moduleName] = {};
        var mount = new Mount(moduleName, modulePath, socketPath);
        MountTable.SetProcess(moduleName, mount.Process.pid, mount);
    };
    MountTable.Restart = function (moduleName) {
        var mountInfo = MountTable.mapping[moduleName];
        if (mountInfo)
            mountInfo.mount.Stop(true);
    };
    MountTable.SetProcess = function (moduleName, pid, mount) {
        var oldPid = MountTable.mapping[moduleName]['pid'];
        if (oldPid)
            delete MountTable.pidMapping[oldPid];
        MountTable.mapping[moduleName]['pid'] = pid;
        MountTable.mapping[moduleName]['mount'] = mount;
        MountTable.pidMapping[pid] = moduleName;
    };
    MountTable.SetRPC = function (moduleName, rpc) {
        MountTable.mapping[moduleName]['rpc'] = rpc;
    };
    MountTable.Get = function (funcid) {
        var funcInfo = APIConfig.getAPIConfig()[funcid];
        if (funcInfo && funcInfo.moduleName)
            return MountTable.mapping[funcInfo.moduleName];
        return null;
    };
    MountTable.GetByPid = function (pid) {
        var moduleName = MountTable.pidMapping[pid];
        return MountTable.mapping[moduleName];
    };
    MountTable.mapping = {};
    MountTable.pidMapping = {};
    return MountTable;
})();
exports.MountTable = MountTable;
var Mount = (function (_super) {
    __extends(Mount, _super);
    function Mount(moduleName, modulePath, socketPath) {
        _super.call(this, moduleName);
        this.moduleName = moduleName;
        this.modulePath = modulePath;
        this.socketPath = socketPath;
        this.Start(true);
    }
    Mount.prototype.Start = function (forever) {
        if (forever === void 0) { forever = true; }
        if (!this.IsChoking()) {
            if (this.Process) {
                this.Process.kill('SIGHUP');
                info("OK");
                _super.prototype.Start.call(this, forever);
            }
            else {
                this.Process = child_process.spawn('./Proxy', [this.moduleName, path.join(process.cwd(), this.modulePath), this.socketPath]);
                this.Process.stdout.on("data", function (data) {
                    info(data.toString());
                });
                info("OK");
                _super.prototype.Start.call(this, forever);
            }
        }
    };
    Mount.prototype.OnChoke = function () {
        var _this = this;
        _super.prototype.OnChoke.call(this);
        this.Stop();
        (function () {
            info("Done, waiting for recall");
            setTimeout(function () {
                _this.ClearChoke();
                _this.Start(true);
            }, 2000);
        })();
        return true;
    };
    return Mount;
})(Process);
