require('../../../SYS/Env');
import net = require('net');
import util = require('util');
import RPC = require("../../../Modules/RPC/index");
import APIServer = require('../../../SYS/APIServer');
import APIManager = require('../../../SYS/APIManager');
import pm = require('../../../System/API/Permission');
require('../../../System/API/PermissionDef');

export function Initalize(sockPath:string) {

    var sock = net.connect(sockPath, () => {
        var rpc = new RPC.BinaryRPCEndpoint(sock);
        var api = APIManager.GetAPI(rpc).API;
        var turns = 10 * 1000;
        var letterCount = 0, turnCount = 0;

        function selfCount(linkstr) {
            info('RESULT:', linkstr, 'letters:', letterCount, 'trunCount', turnCount + 1);
            letterCount += linkstr.length;
            turnCount += 1;
            if(turnCount === turns){
                console.log('RESULT: SUCCESS');
                return;
            }

            process.nextTick(oneJob);
        }

        function oneJob(){
            (<any>api).NetworkService.Crawl((err, html) => {
                if (err){
                    error(err);
                    selfCount(err);
                }
                (<any>api).Parser.ExtractLinks(html, (err, linkstr)=>{
                    selfCount(linkstr);
                });
            });
        }

        process.nextTick(oneJob);

        //for(var i = 0; i<turns; i++) {
        //    process.nextTick(oneJob);
        //}

        // quit mechanism
        function destory() {
            fatal('process [' + process.pid + '] is exiting');
            process.kill(process.pid);
        }

        rpc.on('error', destory);
        rpc.on('close', destory);
    });
    sock.on('error', function (err) {
        error(err);
    });
}

(function () {
    var sockPath = process.argv[2];
    trace('socketPath', sockPath);
    Initalize(sockPath);
})();