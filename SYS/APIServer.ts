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

var onCall = (funcid, param, cb) => {
    var rpc:RPC.RPCEndpoint = this
        , senderPid = process.pid
        , permission = APIConfig.getAPIConfig()[funcid]['permission']
        , _p = pm.Encode(permission);
    if (!pm.Check(pm.GetPermission(senderPid), _p)) {
        return cb(new EvalError("Permission Denied"));
    }

    info("Incoming " + funcid);
    var mountInfo = MountTable.GetByFuncId(funcid);
    if (mountInfo && mountInfo['rpc']) {
        var target:RPC.RPCEndpoint = mountInfo['rpc'];
        return target.Call(funcid, param, cb);
    }
    else
        return cb(new Error("Remote Client is down"));
};

var onEmit = (eventid, param) => {
    trace('onEmit', eventid, param);
    var senderPid = process.pid
        , permission = APIConfig.getEventsConfig()[eventid]['permission']
        , _p = pm.Encode(permission);
    if (!pm.Check(pm.GetPermission(senderPid), _p)) {
        return;
    }

    EventsHub.GetEventsCallbacks(eventid).forEach(function(cb:Function){
       cb.apply(null, param);
    });
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

            MountTable.MountNew(moduleName, modulePath, socketPath);
        });
    }
}