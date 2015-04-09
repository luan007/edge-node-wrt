import child_process = require('child_process');
import path = require('path');
import events = require('events');
import net = require("net");
import uscred = require("unix-socket-credentials");
import RPC = require('../Modules/RPC/index');
import Process = require("../System/SubSys/Native/Process");
import sockPath = require('../System/Lib/Sockets/SockPath');
import pm = require('../System/API/Permission');
import APIConfig = require('./APIConfig');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;

var __SOCK_PATH:string; //socketPath

var _api_server:net.Server = net.createServer({allowHalfOpen: true}, (socket) => {
    socket.pause();
    socket.once("error", (err) => {
        error(err);
        socket.destroy();
    });

    uscred.getCredentials(socket, (err, res) => {
        if (err) {
            return socket.destroy();
        }
        trace("New Socket Inbound, Entering loop - PID " + (res.pid + "").bold);

        var rpc = new RPC.RPCEndpoint(socket);
        rpc['remote'] = res.pid;
        var mountInfo = MountTable.GetByPid(res.pid);
        if (mountInfo) {// system modules
            pm.SetPermission(res.pid, [Permission.System]); // System privilege
            MountTable.SetRPC(mountInfo.moduleName, rpc);

            socket.removeAllListeners('error');
            socket.once("error", (err) => {
                error(err);
                socket.destroy();
                MountTable.Restart(mountInfo.moduleName); // restart process
            });
        }
        rpc.SetFunctionHandler(onInvoke);
    });
});
function onInvoke(funcid, param, cb) {
    var rpc:RPC.RPCEndpoint = this
        , senderPid = rpc["remote"]
        , permission = APIConfig.getAPIConfig()[funcid]['permission']
        , _p = pm.Encode(permission);
    if (!pm.Check(pm.GetPermission(senderPid), _p)) {
        return cb(new EvalError("Permission Denied"));
    }

    info("Incoming " + funcid);
    var mountInfo = MountTable.Get(funcid);
    if (mountInfo && mountInfo['rpc']) {
        var target:RPC.RPCEndpoint = mountInfo['rpc'];
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
export function Initialize() {
    sockPath.Initialize();

    __SOCK_PATH = getSock(UUIDstr());
    _api_server.listen(__SOCK_PATH, () => {
        exec("chown", "nobody", __SOCK_PATH, () => {
            exec("chmod", "777", __SOCK_PATH, () => {
                trace("API Port Permission is set");

                mountAll(__SOCK_PATH);
            });
        });
    });
}