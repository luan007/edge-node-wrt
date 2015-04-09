import child_process = require('child_process');
import path = require('path');
import events = require('events');
import net = require("net");
import uscred = require("unix-socket-credentials");
import RPC = require('../Modules/RPC/index');
import Process = require("../System/SubSys/Native/Process");
import sockPath = require('../System/Lib/Sockets/SockPath');
import APIConfig = require('./APIConfig');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;

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
        var mountInfo = MountTable.GetByPid(res.pid);
        if(mountInfo){
            MountTable.SetRPC(mountInfo.moduleName, rpc);

            socket.removeAllListeners('error');
            socket.on("error", (err) => {
                error(err);
                socket.destroy();
                MountTable.Restart(mountInfo.moduleName); // restart process
            });
        }
        rpc.SetFunctionHandler(onInvoke);
    });
});
function onInvoke(funcid, param, cb) {
    //var rpc:RPC.RPCEndpoint = this;
    info("Incoming " + funcid);

    var mountInfo = MountTable.Get(funcid);
    if(mountInfo && mountInfo['rpc']){
        var rpc:RPC.RPCEndpoint = mountInfo['rpc'];
        return rpc.Call(funcid, param, cb);
    }
    else
        return cb(new Error("Remote Client is down"));
}
function mountAll(socketPath) {
    var modulesConfig = APIConfig.modulesConfig();
    Object.keys(modulesConfig).forEach(function (moduleName) {
        var modulePath = modulesConfig[moduleName]['Path'];

        MountTable.MountNew(moduleName, modulePath, socketPath);
    });
}
export function Initialize() {
    sockPath.Initialize();

    var _socketPath = getSock(UUIDstr());
    _api_server.listen(_socketPath, () => {
        exec("chown", "nobody", _socketPath, () => {
            exec("chmod", "777", _socketPath, () => {
                trace("API Port Permission is set");

                mountAll(_socketPath);
            });
        });
    });
}
