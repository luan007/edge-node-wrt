import net = require("net");
import fs = require("fs");
import rpc = require("../../Modules/RPC/index");
import APIManager = require('../../Modules/RPC/API/APIManager');
import perm = require("./Permission");
import evhub = require("./EventHub");
import events = require("events");
import async = require("async");
import uscred = require("unix-socket-credentials");
import util = require("util");
import nginx = require('../Common/Native/nginx');

export interface TypedRPCEndpoint extends rpc.RPCEndpoint {
    type: string;
    remote: string;
}

var _port;
var _proc: API_Socket_Processor[] = [];

var _api_server: net.Server = net.createServer({ allowHalfOpen: true }, (sock) => {
    _api_server_on_new_socket(sock);
});

function _api_server_on_new_socket(socket: net.Socket) {
    //Get Unix Socket UID/PID

    socket.pause();
    socket.on("error", (err) => {
        error(err);
        socket.destroy();
    });

    uscred.getCredentials(socket, (err, res) => {
        info("New Socket Inbound, Entering loop - PID " + (res.pid + "").bold);
        if (err) {
            //error(err); //FAILED
            return socket.destroy();
        }
        var temp_closure = [];
        for (var i = 0; i < _proc.length; i++) {
            ((sock, cred, t) => {
                temp_closure.push((cb) => {
                    _proc[t](cred, sock, cb);
                });
            })(socket, res, i);
        }
        async.series(temp_closure, (err_or_quit: any, result) => {
            if (err_or_quit !== true) {
                //KILL THIS SOCKET
                warn("Socket is not Handled, Destroy - Sock_PID = " + (res.pid + "").bold);
                socket.destroy();
            }
            temp_closure = undefined;
        });

    });
}

export function AddHandler(connection_Processor: API_Socket_Processor) {
    trace(("#" + _proc.length).bold + " Pushing Handler into API Server Stack");
    _proc.push(connection_Processor);
}

export function Serve(socket: net.Socket, remoteType, remoteId, clientId_for_event, cb?: PCallback<TypedRPCEndpoint>) {
    socket.removeAllListeners("error");
    var r = <TypedRPCEndpoint> new rpc.RPCEndpoint(socket);

    r.on("error", (err) => {
        if (clientId_for_event !== undefined) {
            warn("Removing from Hub " + clientId_for_event);
            evhub.RemoveFromEventHub(clientId_for_event);
        }
        r.Destroy();
        error(("Socket Disconnected [" + remoteType + ":" + remoteId + "]").bold);
        //error(err);
    });

    r.type = remoteType;
    r.remote = remoteId;

    if (clientId_for_event !== undefined) {
        evhub.AddToEventHub(clientId_for_event, r);
    }
    trace("Resuming Socket...");
    socket.resume();
    trace("Serving API");
    rpc.APIManager.ServeAPI(r);

    if (cb) {
        //r.Ready();
        //r.once("ready", () => {
        cb(undefined, r);
        //});
    }
    return r;
    //return r;
}

export function GetAPIServer_SockPath() {
    return _port;
}

export function GetAPIJSON() {
    return rpc.APIManager.ToJSON();
}

function SenderType(context): string {
    return context.rpc.type;
}

function SenderId(context): string {
    return context.rpc.remote;
}

function GenerateStartupScript(port) {
    var _ngx_api = 'API = {}\n';
    var _ngx_permission = (nginx.NGINX_PERMISSION);
    var _api = JSON.parse(APIManager.ToJSON((f, p) => {
        return perm.Check(_ngx_permission, f["_p"]);
    }))["f"];
    Object.keys(_api).forEach((v, i, a) => {
        _ngx_api += 'API["' + v + '"]=' + _api[v] + '\n';
    });
    var _script =
        'API_Endpoint=' + '"unix:' + port + '"\n'
        + _ngx_api + 'require("Init")\n';

    //var conf = 'API_Endpoint="unix:' + port + '"\n' +
    //    'API = {}\n' +
    //    'API["Proxy.SelfTest"]=9\n' +
    //    'API["Proxy.GetTarget"]=23\n' +
    //    'API["Proxy.AuthUser"]=25\n' +
    //    'require("Init")\n';
    return fs.writeFileSync(CONF.LUA_NGINX_SOCKET, _script, { flag: 'w' });
}


function GenerateGUIScript(port) {
    // var _ngx_permission = (nginx.NGINX_PERMISSION);
    // var _api = JSON.parse(APIManager.ToJSON((f, p) => {
    //     return perm.Check(_ngx_permission, f["_p"]);
    // }))["f"];
    var _api = JSON.parse(APIManager.ToJSON());
    _api['port'] = port;
    fs.writeFileSync("/var/GUI_sock", JSON.stringify(_api), { flag: 'w' });
}

trace("Setting up TypedRPCEndpoint Functions");
global.SenderType = SenderType;
global.SenderId = SenderId;

export function Initialize(cb) {

    SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
        if (CONF.IS_DEBUG) {
            info(" ** API DUMP ** ");
            info("\n" + util.inspect(JSON.parse(rpc.APIManager.ToJSON().toString())));
        }
        info(" ** -------- ** ");
    });

    _port = getSock(UUIDstr());
    _api_server.listen(_port, () => {
        exec("chown", "nobody", _port, () => {
            exec("chmod", "777", _port, () => {
                GenerateStartupScript(_port);
                GenerateGUIScript(_port);
                trace("API Port Permission is set");
                cb();
            });
        });
    });
    trace("API Server Listening on " + _port.bold.magenta);

}

export function Diagnose(callback: Callback) {
    var exist = fs.existsSync(CONF.LUA_NGINX_SOCKET) && fs.existsSync(_port);
    if (!exist) return callback(new Error('Server listening failed.'));
    return callback(null, true);
}

