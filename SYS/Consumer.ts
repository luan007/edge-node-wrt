require('./Env');
import RPC = require("../Modules/RPC/index");
import net = require('net');
import APIServer = require('./APIServer');
import APIManager = require('./APIManager');

var sockPath = '/tmp/fdsock/5c3668b50eaf45ccbce607a92826c6a4.t';
info('sockPath', sockPath);

net.connect(sockPath, (sock) => {
    var rpc = new RPC.RPCEndpoint(sock);
    var api = APIManager.GetAPI(rpc);
    (<any>api).FakeService.FakeA((err, res) => {
        if(err) error(err);
        info(res);
    });
});