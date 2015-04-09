var net = require("net");
var rpc = require("../../Modules/RPC/index");
var evhub = require("./EventHub");
var async = require("async");
var uscred = require("unix-socket-credentials");
var Node = require("Node");
var _port;
var _proc = [];
var _api_server = net.createServer({ allowHalfOpen: true }, function (sock) {
    _api_server_on_new_socket(sock);
});
function _api_server_on_new_socket(socket) {
    socket.pause();
    socket.on("error", function (err) {
        error(err);
        socket.destroy();
    });
    uscred.getCredentials(socket, function (err, res) {
        trace("New Socket Inbound, Entering loop - PID " + (res.pid + "").bold);
        if (err) {
            return socket.destroy();
        }
        var temp_closure = [];
        for (var i = 0; i < _proc.length; i++) {
            (function (sock, cred, t) {
                temp_closure.push(function (cb) {
                    _proc[t](cred, sock, cb);
                });
            })(socket, res, i);
        }
        async.series(temp_closure, function (err_or_quit, result) {
            if (err_or_quit !== true) {
                warn("Socket is not Handled, Destroy - Sock_PID = " + (res.pid + "").bold);
                socket.destroy();
            }
            temp_closure = undefined;
        });
    });
}
function AddHandler(connection_Processor) {
    trace(("#" + _proc.length).bold + " Pushing Handler into API Server Stack");
    _proc.push(connection_Processor);
}
exports.AddHandler = AddHandler;
function Serve(socket, remoteType, remoteId, clientId_for_event, cb) {
    socket.removeAllListeners("error");
    var r = new rpc.RPCEndpoint(socket);
    r.on("error", function (err) {
        if (clientId_for_event !== undefined) {
            warn("Removing from Hub " + clientId_for_event);
            evhub.RemoveFromEventHub(clientId_for_event);
        }
        r.Destroy();
        error(("Socket Disconnected [" + remoteType + ":" + remoteId + "]").bold);
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
        cb(undefined, r);
    }
    return r;
}
exports.Serve = Serve;
function GetAPIServer_SockPath() {
    return _port;
}
exports.GetAPIServer_SockPath = GetAPIServer_SockPath;
function GetAPIJSON() {
    return rpc.APIManager.ToJSON();
}
exports.GetAPIJSON = GetAPIJSON;
function SenderType(context) {
    return context.rpc.type;
}
function SenderId(context) {
    return context.rpc.remote;
}
function Initialize() {
    SYS_ON(0 /* LOADED */, function () {
        if (CONF.IS_DEBUG) {
            trace(" ** API DUMP ** ");
            trace("\n" + Node.util.inspect(JSON.parse(rpc.APIManager.ToJSON().toString())));
        }
        trace(" ** -------- ** ");
    });
    trace("Setting up TypedRPCEndpoint Functions");
    global.SenderType = SenderType;
    global.SenderId = SenderId;
    _port = getSock(UUIDstr());
    _api_server.listen(_port, function () {
        exec("chown", "nobody", _port, function () {
            exec("chmod", "777", _port, function () {
                trace("API Port Permission is set");
            });
        });
    });
    trace("API Server Listening on " + _port.bold.magenta);
}
exports.Initialize = Initialize;
