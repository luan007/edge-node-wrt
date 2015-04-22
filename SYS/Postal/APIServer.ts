import net = require("net");
import events = require('events');
import uscred = require("unix-socket-credentials");
import RPC = require('../../Modules/RPC/index');
import Process = require("../../System/SubSys/Native/Process");
import sockPath = require('../../System/Lib/Sockets/SockPath');
import pm = require('../../System/API/Permission');
import APIConfig = require('../APIConfig');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;
import EventsHub = require('../EventsHub');
var postal = require('postal');

require('../Env');
require('colors');
require('../../System/API/PermissionDef');

export class APIServer extends events.EventEmitter {
    private __func_sock_path:string;
    private _server_role = 1;
    private _server_count = 0;
    private _func_api_server:net.Server;
    private modulesLoaded:number;
    private modulesCount:number;

    constructor() {
        super();

        sockPath.Initialize();

        this.__func_sock_path = getSock(UUIDstr());
        this._func_api_server = net.createServer({allowHalfOpen: true}, (socket) => {
            socket.pause();
            socket.on("error", (err) => {
                error(err);
                socket.destroy();
            });

            uscred.getCredentials(socket, (err, res) => {
                if (err) {
                    return socket.destroy();
                }

                var mountInfo = MountTable.GetByPid(res.pid);
                if (mountInfo) {// system modules
                    pm.SetPermission(res.pid, pm.Encode([Permission.System]));

                    var d = dnode({
                        registerServer: function (sockPath, cb) {
                            MountTable.SetSocketPath(mountInfo.moduleName, sockPath);
                            cb();
                        },
                        invoke: function(funcId, arr, cb){
                            var moduleInfo = MountTable.GetByFuncId(funcId);
                            if(moduleInfo && moduleInfo['sockPath']) {
                                dnode.connect(moduleInfo['sockPath']).on('remote', function (remote) {
                                    remote.invoke(funcId, arr, cb);
                                });
                            }
                        }
                    });
                    socket.pipe(d).pipe(socket);

                    this.modulesLoaded += 1;
                    trace('modulesLoaded', this.modulesLoaded);
                    if (this.modulesLoaded === this.modulesCount) {
                        this.emit('loaded');
                    }
                } else {

                }

                socket.resume();
            });
        });
        this._func_api_server.listen(this.__func_sock_path, () => {
            exec("chown", "nobody", this.__func_sock_path, () => {
                exec("chmod", "777", this.__func_sock_path, () => {

                    console.log("API Port Permission is set");

                    this.mountAll(this.__func_sock_path);

                    this.selfCount();
                });
            });
        });
    }

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

    public getFuncSockPath() {
        return this.__func_sock_path;
    }

    public ShutDown() {
        this.removeAllListeners();
    }

    private selfCount(){
        this._server_count += 1;
        if(this._server_count == this._server_role)
            this.emit('ready');
    }
}