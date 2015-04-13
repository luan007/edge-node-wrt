//require('./Env');
import RPC = require("../Modules/RPC/index");
import net = require('net');
import APIServer = require('./APIServer');
import APIManager = require('./APIManager');
import util = require('util');
require('../System/API/PermissionDef');
import pm = require('../System/API/Permission');

export function Initalize(sockPath:string) {

    warn('consumer - PID', process.pid);

    var sock = net.connect(sockPath, () => {
        pm.SetPermission(process.pid, pm.Encode([Permission.System]));

        var rpc = new RPC.RPCEndpoint(sock);
        var api = APIManager.GetAPI(rpc).API;

        api.RegisterEvent(['Fake.Up', 'Fake.Down'], (errs, sucs)=> {
            if (errs) fatal('RegisterEvent errors:', errs);

            (<any>api).FakeService.Fake.on('Up', () => {
                trace('EVENT: [Fake.Up] has called back.');
            });

            (<any>api).FakeService.Fake.on('Down', () => {
                trace('EVENT: [Fake.Up] has called back.');
            });
        });

        (<any>api).CalcService.Calc((err, res) => {
            if (err) error(err);
            info(res);
        });
    });
    sock.on('error', function (err) {
        error(err);
    });
}