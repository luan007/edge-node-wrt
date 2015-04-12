//require('./Env');
import RPC = require("../Modules/RPC/index");
import net = require('net');
import APIServer = require('./APIServer');
import APIManager = require('./APIManager');
import util = require('util');
require('../System/API/PermissionDef');
import pm = require('../System/API/Permission');

export function Initalize(sockPath:string) {

    var sock = net.connect(sockPath, () => {
        pm.SetPermission(process.pid, pm.Encode([Permission.System]));

        var rpc = new RPC.RPCEndpoint(sock);
        var api = APIManager.GetAPI(rpc).API;
        (<any>api).FakeService.ON('Fake.Up', () => {
            trace('EVENT: [Fake.Up] has called back.');
        });

        (<any>api).FakeService.FakeA((err, res) => {
            if (err) error(err);
            info(res);
        });
    });
    sock.on('error', function (err) {
        error(err);
    });
}