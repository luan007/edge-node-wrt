import net = require("net");
import events = require('events');
import uscred = require("unix-socket-credentials");
import RPC = require('../../Modules/RPC/index');
import Process = require("../../System/SubSys/Native/Process");
import sockPath = require('../../System/Lib/Sockets/SockPath');
import pm = require('../../System/API/Permission');
import APIConfig = require('../APIConfig');
import _MountTable = require('../MountTable');
import MountTable = _MountTable.MountTable;
import EventsHub = require('../EventsHub');
var axon = require('axon');

require('../Env');
require('colors');
require('../../System/API/PermissionDef');

export class APIServer extends events.EventEmitter {
    private __func_sock_path:string;
    private __msg_sock_path:string;
    private _func_api_server:net.Server = net.createServer({allowHalfOpen: true});
    private _msg_api_server:net.Server = net.createServer({allowHalfOpen: true});
    private _server_role = 2;
    private _server_count = 0;

    constructor() {
        super();

        sockPath.Initialize();

        this.__func_sock_path = getSock(UUIDstr());
        this._func_api_server.listen(this.__func_sock_path, () => {
            exec("chown", "nobody", this.__func_sock_path, () => {
                exec("chmod", "777", this.__func_sock_path, () => {
                    console.log("API FUNC Port Permission is set");

                    var sock = axon.socket('req');
                    sock.bind(this.__func_sock_path);

                    this.functionHandler(sock);

                    this.selfCount();
                });
            });
        });
        this.__msg_sock_path = getSock(UUIDstr());
        this._msg_api_server.listen(this.__msg_sock_path, () => {
            exec("chown", "nobody", this.__msg_sock_path, () => {
                exec("chmod", "777", this.__msg_sock_path, () => {
                    console.log("API MSG Port Permission is set");

                    var sock = axon.socket('pub-emitter');
                    sock.bind(this.__msg_sock_path);

                    this.selfCount();
                });
            });
        });
    }

    public getFuncSockPath() {
        return this.__func_sock_path;
    }
    public getMsgSockPath() {
        return this.__msg_sock_path;
    }

    public ShutDown() {
        this.removeAllListeners();
        this._func_api_server.close((err) => {
        });
        this._msg_api_server.close((err) => {
        });
    }

    private selfCount(){
        this._server_count += 1;
        if(this._server_count == this._server_role)
            this.emit('ready');
    }

    private remoteCall(service, funcId){

    }

    private functionHandler(sock){
        sock.on('connect', ()=>{
           info('connected');
        });
        sock.on('message', function(){
            var args = [].slice.call(arguments);
            var reply = args.pop();
            var action = args.unshift();

            if(action == 'ServiceA.FakeA'){
                reply.call(null, action);
            }
        });
    }

    private msgHandler(sock, msg, handler){

    }
}