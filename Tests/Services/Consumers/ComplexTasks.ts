require('../../../SYS/Env');
import net = require('net');
import util = require('util');
import RPC = require("../../../Modules/RPC/index");
import APIServer = require('../../../SYS/APIServer');
import APIManager = require('../../../SYS/APIManager');
import pm = require('../../../System/API/Permission');
require('../../../System/API/PermissionDef');

export function Initalize(sockPath:string) {

    APIManager.Connect(sockPath, (err, api) => {
    //var sock = net.connect(sockPath, () => {
    //    var rpc = new RPC.BinaryRPCEndpoint(sock);
    //    var api = APIManager.GetAPI(rpc).API;
        var turns = 100 * 1000;
        var letterCount = 0, turnCount = 0;

        function selfCount(linkstr, bytes) {
            //info('RESULT:', linkstr, 'letters:', letterCount, 'bytes', bytes, 'turnCount', turnCount + 1);
            info('letters:', letterCount, 'total bytes', bytes, 'turnCount', turnCount + 1);
            letterCount += linkstr.length;
            turnCount += 1;
            if (turnCount === turns) {
                console.log('RESULT: SUCCESS');
                return;
            }

            process.nextTick(oneJob);
        }

        function oneJob() {
            var parseTask = (err, html) => {
                if (err) {
                    error('NetworkService.Crawl ERROR ->', err);
                    selfCount(err, 0);
                } else {
                    (<any>api).Parser.ExtractLinks(html, (err, linkstr)=> {
                        selfCount(linkstr, html.length);
                    });
                }
            };
            (<any>api).NetworkService.Crawl('www.baidu.com', parseTask);
        }

        process.nextTick(oneJob);

        //for(var i = 0; i<turns; i++) {
        //    process.nextTick(oneJob);
        //}
    });
}

(function () {
    var sockPath = process.argv[2];
    trace('socketPath', sockPath);
    Initalize(sockPath);
})();