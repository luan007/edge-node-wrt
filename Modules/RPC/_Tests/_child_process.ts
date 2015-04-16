var api = JSON.parse(process.env["API"]);
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

import net = require("net");

import APIManager = require("../API/APIManager");
import RPCEndpoint = require("../RPC/BinaryRPCEndpoint");

var sock = net.connect(9999, () => {


    var rpc = new RPCEndpoint.BinaryRPCEndpoint(sock);
    rpc.SetFunctionHandler(function(funid, param, cb){
        console.log('FUNC', funid, param);
        cb(undefined, 'Hi');
    });
    rpc.SetEventHandler(console.log);

});

