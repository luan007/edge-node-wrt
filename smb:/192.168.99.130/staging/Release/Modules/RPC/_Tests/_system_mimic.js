var net = require("net");
var process = require("child_process");
var APIManager = require("../API/APIManager");
var RPCEndpoint = require("../RPC/RPCEndpoint");
function Test(callback) {
    console.log("Server.Test got Fired");
    console.log(this);
    callback(null, " Good ");
    callback(null, " Good ");
    callback(null, " Good ");
    callback(null, " Good ");
    callback(null, " Good ");
}
APIManager.RegisterFunction(Test, "Server.Test.A.B.C");
APIManager.CreateEvent({}, "Server.testevent");
var json = APIManager.ToJSON();
var api_server = net.createServer({ allowHalfOpen: true }, function (sock) {
    console.log("Client Connected");
    var rpc = new RPCEndpoint.RPCEndPoint(sock);
    APIManager.ServeAPI(rpc);
    setTimeout(function () {
        APIManager.EmitEvent(rpc, "Server.testevent", []);
    }, 1000);
    console.log(sock.remotePort);
}).listen(9999);
process.fork("_child_process.js", [], {
    env: {
        API: JSON.stringify(json)
    }
});
