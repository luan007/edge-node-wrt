require('../../../SYS/Env');
import net = require('net');
import util = require('util');
import RPC = require("../../../Modules/RPC/index");
import APIServer = require('../../../SYS/APIServer');
import APIManager = require('../../../SYS/APIManager');
import pm = require('../../../System/API/Permission');
require('../../../System/API/PermissionDef');

export function Initalize(sockPath:string) {

    //console.log('consumer - PID', process.pid);

    var sock = net.connect(sockPath, () => {
        var rpc = new RPC.RPCEndpoint(sock);
        var api = APIManager.GetAPI(rpc).API;

        api.RegisterEvent(['Huge.Come', 'Huge.Go'], (errs, sucs)=> {
            if (errs) fatal('RegisterEvent errors:', errs);

            (<any>api).HugeParamsEmitter.Huge.on('Come', () => {
                info('EVENT: [Huge.Come] has called back.');
            });

            (<any>api).HugeParamsEmitter.Huge.on('Go', () => {
                info('EVENT: [Huge.Go] has called back.');
            });

            (<any>api).HugeParamsEmitter.Howl((err, res) => {
                if (err) error(err);
                info('HugeParamsEmitter.Howl executing result:', res);
            });
        });

        // quit mechanism
        function destory(){
            fatal('process [' + process.pid + '] exiting');
            process.kill(process.pid);
        }

        rpc.on('error', destory);
        rpc.on('close', destory);
    });
    sock.on('error', function (err) {
        error(err);
    });
}

(function(){
    var sockPath = process.argv[2];
    trace('socketPath', sockPath);
    Initalize(sockPath);
})();