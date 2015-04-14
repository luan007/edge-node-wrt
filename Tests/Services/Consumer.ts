require('../../SYS/Env');
import net = require('net');
import util = require('util');
import RPC = require("../../Modules/RPC/index");
import APIServer = require('../../SYS/APIServer');
import APIManager = require('../../SYS/APIManager');
import pm = require('../../System/API/Permission');
require('../../System/API/PermissionDef');

export function Initalize(sockPath:string) {

    warn('consumer - PID', process.pid);

    var sock = net.connect(sockPath, () => {
        pm.SetPermission(process.pid, pm.Encode([Permission.System]));

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

    });
    sock.on('error', function (err) {
        error(err);
    });
}