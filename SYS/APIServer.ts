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

var onCall = function (funcid, trackid, ageid, frame) {
    var rpc:RPC.BinaryRPCPipe = this
        , senderPid = rpc['pid'];

    if (funcid === 0) {//register event
        var t = '';
        frame.on('data', function (d) {
            t = t + d.toString();
        }).on('end', function () {
            var param = JSON.parse(t);
            var event_id_list = (<Array<number>>param);
            trace('event_id_list ========1', event_id_list);
            EventsHub.RemoteAddEventListener(senderPid, event_id_list, (errs, sucs) => {
                trace('event_id_list ========2', event_id_list);
                rpc.Reply(funcid, trackid, ageid, errs, sucs);
            });
        });

    } else if (funcid === -1) {//unregister event
        var t = '';
        frame.on('data', function (d) {
            t = t + d.toString();
        }).on('end', function () {
            var param = JSON.parse(t);
            var event_id_list = (<Array<number>>param);
            EventsHub.RemoteRemoveEventPid(senderPid, event_id_list, () => {
                rpc.Reply(funcid, trackid, ageid, null, '');
            });
        });
        //return EventsHub.RemoteRemoveEventPid(senderPid, event_id_list, callback);
    }
    else { // remote call
        trace('[server] on remote call');
        var permission = APIConfig.getAPIConfig()[funcid]['permission']
            , _p = pm.Encode(permission);
        //warn('remote call', funcid);
        if (!pm.Check(pm.GetPermission(senderPid), _p)) {
            rpc.Reply(funcid, trackid, ageid, new EvalError('Permission Denied [' + senderPid + ']'), undefined);
        }
        var mountInfo = MountTable.GetByFuncId(funcid);
        if (mountInfo && mountInfo['rpc']) {
            var target:RPC.BinaryRPCPipe = mountInfo['rpc'];
            //console.log('Target -> ', target);
            trace('[server] on remote call [', mountInfo.pid, ']', mountInfo.moduleName);
            return target;
        }
        else
            rpc.Reply(funcid, trackid, ageid, new Error('Remote Client is down'), null);
    }
};

var onEmit = function (eventid) {
    //var rpc:RPC.RPCEndpoint = this
    //    , senderPid = rpc['pid'];

    var pids = EventsHub.RemoteGetEventPids(eventid);
    if (pids && Array.isArray(pids)) {
        //warn('onEmit pids', pids, 'process.pid', process.pid);
        var rpcs = [];

        for (var i = 0, len = pids.length; i < len; i++) {
            var pid = pids[i];
            var rpc = <RPC.BinaryRPCPipe>MountTable.GetByPid(pid).rpc;
            //trace('onEmit push ----- rpc', rpc);
            rpcs.push(rpc);
        }
        return rpcs;
    }
};

export class APIServer extends events.EventEmitter {
    private __SOCK_PATH:string;
    private modulesLoaded:number;
    private modulesCount:number;

    constructor() {
        super();

        global.SERVER = 1;

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
        this._api_server.on('error', (err) => {
            error(err);
            error(err.stack);
        });
    }

    public getSockPath() {
        return this.__SOCK_PATH;
    }

    public ShutDown() {
        this._api_server.close((err) => {
            MountTable.ClearAll();
            EventsHub.ClearAll();
            this.removeAllListeners();
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
        //socket.on('close', (had_error) => {
        //    trace('socket closed', had_error);
        //    socket.destroy();
        //});

        uscred.getCredentials(socket, (err, res) => {
            if (err) {
                return socket.destroy();
            }
            trace("New Socket Inbound, Entering loop - PID " + (res.pid + "").bold);

            var rpc = new RPC.BinaryRPCPipe(socket);
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
                    rpc.Destroy();
                    MountTable.Restart(mountInfo.moduleName); // restart process
                });
            } else { // non-system modules
                MountTable.SetPidRPC(res.pid, rpc);
                socket.removeAllListeners('error');
                socket.on("error", (err) => {
                    error(err);
                    rpc.Destroy();
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

            MountTable.MountNewSystemModule(moduleName, modulePath, socketPath);
        });
    }
}