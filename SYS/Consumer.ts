//require('./Env');
import RPC = require("../Modules/RPC/index");
import net = require('net');
import APIServer = require('./APIServer');
import APIManager = require('./APIManager');
import util = require('util');
import Permission = require('../System/API/Permission');

export function Initalize(sockPath:string) {

    var sock = net.connect(sockPath, () => {
        Permission.SetPermission(process.pid, [1]);

        var rpc = new RPC.RPCEndpoint(sock);
        var api = APIManager.GetAPI(rpc).API;
        (<any>api).FakeService.FakeA((err, res) => {
            if (err) error(err);
            info(res);
        });
    });
    sock.on('error', function (err) {
        error(err);
    });
}