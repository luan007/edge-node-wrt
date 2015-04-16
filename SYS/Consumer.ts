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
        var rpc = new RPC.BinaryRPCEndpoint(sock);
        var api = APIManager.GetAPI(rpc).API;

        api.RegisterEvent(['Fake.Up', 'Fake.Down'], (errs, sucs)=> {
            if (errs) fatal('RegisterEvent errors:', errs);

            //trace('api.RegisterEvent', sucs);

            (<any>api).FakeService.Fake.on('Up', () => {
                info('EVENT: [Fake.Up] has called back.');
            });

            (<any>api).FakeService.Fake.on('Down', () => {
                info('EVENT: [Fake.Down] has called back.');
            });

            trace('api.FakeService.Fake', (<any>api).FakeService.Fake);

            (<any>api).FakeService.FakeA((err, res) => {
                if (err) error(err);
                info('FakeService.FakeA executing result:', res);
            });
        });

    });
    sock.on('error', function (err) {
        error(err);
    });
}