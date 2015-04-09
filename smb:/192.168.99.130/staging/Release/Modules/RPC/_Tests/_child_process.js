var api = JSON.parse(process.env["API"]);
var net = require("net");
var APIManager = require("../API/APIManager");
var RPCEndpoint = require("../RPC/RPCEndpoint");
var sock = net.connect(9999, function () {
    var rpc = new RPCEndpoint.RPCEndPoint(sock);
    var API = APIManager.GetAPI(api, rpc).API;
    API.Server.Test.A.B.C(function (err, result) {
        console.log("Err: " + JSON.stringify(err));
        console.log("Result: " + result);
    });
    API.Server.on("testevent", function () {
        console.log("Event Fired!");
    });
});
