var api = JSON.parse(process.env["API"]);

import net = require("net");

import APIManager = require("../API/APIManager");
import RPCEndpoint = require("../RPC/RPCEndpoint");

var sock = net.connect(9999, () => {


    var rpc = new RPCEndpoint.RPCEndPoint(sock);
    var API = APIManager.GetAPI(api, rpc).API;



    API.Server.Test.A.B.C((err, result) => {
        console.log("Err: " + JSON.stringify(err));
        console.log("Result: " + result);
    });

    API.Server.on("testevent", function () {
        console.log("Event Fired!");
    });

});

