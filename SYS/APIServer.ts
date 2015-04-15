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
import EventsHub = require('./EventsHub');

var onCall = function (funcid, param, callback) {
    var rpc:RPC.RPCEndpoint = this
        , senderPid = rpc['pid'];

    if (funcid === 0) {//register event
        if (!param) {
            return callback(new EvalError("Faulty Params"));
        }
        var event_id_list = (<Array<number>>param);
        return EventsHub.RemoteAddEventListener(senderPid, event_id_list, callback);
    } else { // remote call
        var permission = APIConfig.getAPIConfig()[funcid]['permission']
            , _p = pm.Encode(permission);
        //warn('remote call', funcid);
        if (!pm.Check(pm.GetPermission(senderPid), _p)) {
            return callback(new EvalError("Permission Denied [" + senderPid + "]"));
        }
        var mountInfo = MountTable.GetByFuncId(funcid);
        if (mountInfo && mountInfo['rpc']) {
            var target:RPC.RPCEndpoint = mountInfo['rpc'];
            return target.Call(funcid, param, callback);
        }
        else
            return callback(new Error("Remote Client is down"));
    }
};

var onEmit = function (eventid, param) {
    //var rpc:RPC.RPCEndpoint = this
    //    , senderPid = rpc['pid'];

    var pids = EventsHub.RemoteGetEventPids(eventid);
    warn('onEmit pids', pids, 'process.pid', process.pid);

    for (var i = 0, len = pids.length; i < len; i++) {
        var pid = pids[i];
        MountTable.GetByPid(pid).rpc.Emit(eventid, param);
    }
};


export class APIServer extends events.EventEmitter {
    private __SOCK_PATH:string;
    private modulesLoaded:number;
    private modulesCount:number;

    constructor() {
        super();

        info('api.config.json path', process.env.apiConfigFilePath);

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

    public ShutDown() {
        this._api_server.close((err) => {
            MountTable.ClearAll();
            EventsHub.ClearAll();
            if (err)
                fatal(err);
            else
                trace('Server was closed');
        });
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
            rpc['pid'] = res.pid;
            var mountInfo = MountTable.GetByPid(res.pid);
            if (mountInfo) {// system modules
                pm.SetPermission(res.pid, pm.Encode([Permission.System]));

                MountTable.SetRPC(mountInfo.moduleName, rpc);
                this.modulesLoaded += 1;
                trace('modulesLoaded', this.modulesLoaded);

                if (this.modulesLoaded === this.modulesCount) {
                    this.emit('loaded');
                }

                socket.removeAllListeners('error');
                socket.on("error", (err) => {
                    error(err);
                    socket.destroy();
                    MountTable.Restart(mountInfo.moduleName); // restart process
                });
            } else { // non-system modules
                MountTable.SetPidRPC(res.pid, rpc);
            }
            rpc.SetFunctionHandler(onCall);
            rpc.SetEventHandler(onEmit);

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

            MountTable.MountNewSystemModule(moduleName, modulePath, socketPath);
        });
    }
}