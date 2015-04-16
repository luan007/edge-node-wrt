import net = require("net");
import process = require("child_process");
import APIManager = require("../API/APIManager");
import RPCEndpoint = require("../RPC/BinaryRPCEndpoint");
import child_process = require("child_process");
import uuid = require("uuid");

global.UUIDstr = function (short = true): string {
    if (!short) return uuid.v4();
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf.toString("hex");
}

global.UUID = function(): NodeBuffer {
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf;
}


var api_server = net.createServer({ allowHalfOpen: true }, (sock) => {
    console.log("Client Connected");
    var rpc = new RPCEndpoint.BinaryRPCEndpoint(sock);

    rpc.SetFunctionHandler(console.log);
    rpc.SetEventHandler(console.log);
    setInterval(()=>{
        rpc.Emit(0, []);
        rpc.Call(14, ["hello"], (err, result)=>{
            console.log('< ' + result);
        });
    }, 1000);
    console.log(sock.remotePort);

}).listen(9999);


//process.fork("_child_process.js", [], {
//    env: {
//        API : JSON.stringify(json)
//    }
//});

