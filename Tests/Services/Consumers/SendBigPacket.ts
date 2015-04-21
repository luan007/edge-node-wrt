require('../../../SYS/Env');
import net = require('net');
import util = require('util');
import RPC = require("../../../Modules/RPC/index");
import APIServer = require('../../../SYS/APIServer');
import APIManager = require('../../../SYS/APIManager');
import pm = require('../../../System/API/Permission');
require('../../../System/API/PermissionDef');

import fs = require('fs');
import path = require('path');

global.CONSUMER = 1;

// blob size: 312K
var blobPath = path.join(process.env.NODE_PATH
    , '../Applications/Launcher/Main_Staging/public/images/bg/aji.jpg');

export function Initalize(sockPath:string) {

    trace('loading blob...');
    //var blob = fs.readFileSync(blobPath);
    //var blob = new Buffer(1024*300);
    var blob = new Buffer('1244567890');
    trace('blob size:', blob.length);
    //trace('blob size(k):', blob.length / 1024);

    APIManager.Connect(sockPath, (err, api) => {
        if (err) throw err;
        var timeOut = 100 * 1000;
        var turns = 1 * 1;
        var letterCount = 0, turnCount = 0;

        function selfCount(data) {
            //info('RESULT:', linkstr, 'letters:', letterCount, 'bytes', bytes, 'turnCount', turnCount + 1);
            info('total bytes', data.length, 'turnCount', turnCount + 1);
            letterCount += data.length;
            turnCount += 1;
            if (turnCount === turns) {
                console.log('RESULT: SUCCESS');
                return;
            }

            process.nextTick(oneJob);
        }

        function oneJob() {
            var echoTask = (err, data) => {
                if (err) {
                    error('NetworkService.Crawl ERROR ->', err);
                    selfCount('');
                } else {
                    selfCount(data);
                }
            };
            (<any>api).EchoService.Echo(blob, echoTask);
        }

        process.nextTick(oneJob);

        //var timer = setTimeout(() => {
        //    process.emit('exit');
        //    clearTimeout(timer);
        //}, timeOut);
    });
}

(function () {
    var sockPath = process.argv[2];
    trace('socketPath', sockPath);
    Initalize(sockPath);
})();