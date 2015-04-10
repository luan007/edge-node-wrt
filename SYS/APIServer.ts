import net = require("net");
import events = require('events');
import uscred = require("unix-socket-credentials");
import RPC = require('../Modules/RPC/index');
import Process = require("../System/SubSys/Native/Process");
import sockPath = require('../System/Lib/Sockets/SockPath');
import pm = require('../System/API/Permission');
import APIConfig = require('./APIConfig');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;

var onInvoke = (funcid, param, cb) => {
    var rpc:RPC.RPCEndpoint = this
        , senderPid = process.pid
        , permission = APIConfig.getAPIConfig()[funcid]['permission']
        , _p = pm.Encode(permission);
    info('senderPid', senderPid, process.pid);
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
};

export class APIServer extends events.EventEmitter {
    private __SOCK_PATH:string;
    private modulesLoaded:number;
    private modulesCount:number;

    constructor() {
        super();

        sockPath.Initialize();
        this.modulesLoaded = 0;
        this.__SOCK_PATH = getSock(UUIDstr());
        this._api_server.listen(this.__SOCK_PATH, () => {
            exec("chown", "nobody", this.__SOCK_PATH, () => {
                exec("chmod", "777", this.__SOCK_PATH, () => {
                    trace("API Port Permission is set");

                    this.mountAll(this.__SOCK_PATH);
                });
            });
        });
    }

    public getSockPath() {
        return this.__SOCK_PATH;
    }

    private _api_server:net.Server = net.createServer({allowHalfOpen: true}, (socket) => {
        socket.pause();
        socket.on("error", (err) => {
            error(err);
            socket.destroy();
        });
        socket.on('close', (had_error) => {
            trace('socket closed', had_error);
            socket.destroy();
        });

        uscred.getCredentials(socket, (err, res) => {
            if (err) {
                return socket.destroy();
            }
            trace("New Socket Inbound, Entering loop - PID " + (res.pid + "").bold);

            var rpc = new RPC.RPCEndpoint(socket);
            pm.SetPermission(res.pid, [1]); // System privilege
            var mountInfo = MountTable.GetByPid(res.pid);
            if (mountInfo) {// system modules
                MountTable.SetRPC(mountInfo.moduleName, rpc);
                this.modulesLoaded += 1;
                trace('modulesLoaded', this.modulesLoaded);

                if(this.modulesLoaded === this.modulesCount){
                    this.emit('loaded');
                }

                socket.removeAllListeners('error');
                socket.on("error", (err) => {
                    error(err);
                    socket.destroy();
                    MountTable.Restart(mountInfo.moduleName); // restart process
                });
            }
            rpc.SetFunctionHandler(onInvoke);
            socket.resume();
        });
    });

    private mountAll(socketPath) {
        var modulesConfig = APIConfig.getModulesConfig()
            , modulesConfigKeys = Object.keys(modulesConfig);
        this.modulesCount = modulesConfigKeys.length;
        trace('module config', modulesConfig, this.modulesCount);
        modulesConfigKeys.forEach(function (moduleName) {
            var modulePath = modulesConfig[moduleName]['Path'];

            MountTable.MountNew(moduleName, modulePath, socketPath);
        });
    }
}

//var __SOCK_PATH:string
//    , modulesLoaded = 0
//    , modulesCount;
//
//var _api_server:net.Server = net.createServer({allowHalfOpen: true}, (socket) => {
//    socket.pause();
//    socket.on("error", (err) => {
//        error(err);
//        socket.destroy();
//    });
//    socket.on('close', (had_error) => {
//        trace('socket closed', had_error);
//        socket.destroy();
//    });
//
//    uscred.getCredentials(socket, (err, res) => {
//        if (err) {
//            return socket.destroy();
//        }
//        trace("New Socket Inbound, Entering loop - PID " + (res.pid + "").bold);
//
//        var rpc = new RPC.RPCEndpoint(socket);
//        rpc['remote'] = res.pid;
//        var mountInfo = MountTable.GetByPid(res.pid);
//        if (mountInfo) {// system modules
//            pm.SetPermission(res.pid, [Permission.System]); // System privilege
//            MountTable.SetRPC(mountInfo.moduleName, rpc);
//
//            socket.removeAllListeners('error');
//            socket.on("error", (err) => {
//                error(err);
//                socket.destroy();
//                MountTable.Restart(mountInfo.moduleName); // restart process
//            });
//        }
//        rpc.SetFunctionHandler(onInvoke);
//    });
//});
//function onInvoke(funcid, param, cb) {
//    trace('onInvoke', funcid, param, cb);
//    var rpc:RPC.RPCEndpoint = this
//        , senderPid = rpc["remote"]
//        , permission = APIConfig.getAPIConfig()[funcid]['permission']
//        , _p = pm.Encode(permission);
//    if (!pm.Check(pm.GetPermission(senderPid), _p)) {
//        return cb(new EvalError("Permission Denied"));
//    }
//
//    info("Incoming " + funcid);
//    var mountInfo = MountTable.Get(funcid);
//    if (mountInfo && mountInfo['rpc']) {
//        var target:RPC.RPCEndpoint = mountInfo['rpc'];
//        return target.Call(funcid, param, cb);
//    }
//    else
//        return cb(new Error("Remote Client is down"));
//}
//function mountAll(socketPath) {
//    var modulesConfig = APIConfig.getModulesConfig()
//        , modulesConfigKeys = Object.keys(modulesConfig);
//    modulesCount = modulesConfigKeys.length;
//    trace('module config', modulesConfig, modulesCount);
//    modulesConfigKeys.forEach(function (moduleName) {
//        var modulePath = modulesConfig[moduleName]['Path'];
//
//        MountTable.MountNew(moduleName, modulePath, socketPath);
//    });
//}
//
//export function Initialize() {
//    sockPath.Initialize();
//
//    __SOCK_PATH = getSock(UUIDstr());
//    _api_server.listen(__SOCK_PATH, () => {
//        exec("chown", "nobody", __SOCK_PATH, () => {
//            exec("chmod", "777", __SOCK_PATH, () => {
//                trace("API Port Permission is set");
//
//                mountAll(__SOCK_PATH);
//            });
//        });
//    });
//}
//export function getSockPath(){
//    return __SOCK_PATH;
//}