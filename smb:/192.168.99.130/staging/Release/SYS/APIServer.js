var net = require("net");
var uscred = require("unix-socket-credentials");
var RPC = require('../Modules/RPC/index');
var sockPath = require('../System/Lib/Sockets/SockPath');
var pm = require('../System/API/Permission');
var APIConfig = require('./APIConfig');
var _MountTable = require('./MountTable');
var MountTable = _MountTable.MountTable;
var __SOCK_PATH;
var _api_server = net.createServer({ allowHalfOpen: true }, function (socket) {
    socket.pause();
    socket.once("error", function (err) {
        error(err);
        socket.destroy();
    });
    uscred.getCredentials(socket, function (err, res) {
        if (err) {
            return socket.destroy();
        }
        trace("New Socket Inbound, Entering loop - PID " + (res.pid + "").bold);
        var rpc = new RPC.RPCEndpoint(socket);
        rpc['remote'] = res.pid;
        var mountInfo = MountTable.GetByPid(res.pid);
        if (mountInfo) {
            pm.SetPermission(res.pid, [0 /* System */]);
            MountTable.SetRPC(mountInfo.moduleName, rpc);
            socket.removeAllListeners('error');
            socket.once("error", function (err) {
                error(err);
                socket.destroy();
                MountTable.Restart(mountInfo.moduleName);
            });
        }
        rpc.SetFunctionHandler(onInvoke);
    });
});
function onInvoke(funcid, param, cb) {
    var rpc = this, senderPid = rpc["remote"], permission = APIConfig.getAPIConfig()[funcid]['permission'], _p = pm.Encode(permission);
    if (!pm.Check(pm.GetPermission(senderPid), _p)) {
        return cb(new EvalError("Permission Denied"));
    }
    info("Incoming " + funcid);
    var mountInfo = MountTable.Get(funcid);
    if (mountInfo && mountInfo['rpc']) {
        var target = mountInfo['rpc'];
        return target.Call(funcid, param, cb);
    }
    else
        return cb(new Error("Remote Client is down"));
}
function mountAll(socketPath) {
    var modulesConfig = APIConfig.getModulesConfig();
    Object.keys(modulesConfig).forEach(function (moduleName) {
        var modulePath = modulesConfig[moduleName]['Path'];
        MountTable.MountNew(moduleName, modulePath, socketPath);
    });
}
function Initialize() {
    sockPath.Initialize();
    __SOCK_PATH = getSock(UUIDstr());
    _api_server.listen(__SOCK_PATH, function () {
        exec("chown", "nobody", __SOCK_PATH, function () {
            exec("chmod", "777", __SOCK_PATH, function () {
                trace("API Port Permission is set");
                mountAll(__SOCK_PATH);
            });
        });
    });
}
exports.Initialize = Initialize;
