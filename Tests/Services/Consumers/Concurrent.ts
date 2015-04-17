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
        var eventGo = 0, eventCome = 0, howl = 0;

        function selfCount() {
            if (eventGo == 1 && eventCome == 1 && howl == 1) {
                api.UnRegisterEvent(['Huge.Come', 'Huge.Go'], ()=> {
                    console.log('RESULT: SUCCESS');
                });
            }
        }

        api.RegisterEvent(['Huge.Come', 'Huge.Go'], (errs, sucs)=> {
            if (errs) fatal('RegisterEvent errors:', errs);

            (<any>api).HugeParamsEmitter.Huge.on('Come', (...args) => {
                if (eventCome == 0) {
                    info('EVENT: [Huge.Come] has called back.');
                    eventCome = 1;
                    selfCount();
                }
            });

            (<any>api).HugeParamsEmitter.Huge.on('Go', (...args) => {
                if (eventGo == 0) {
                    eventGo = 1;
                    info('EVENT: [Huge.Go] has called back.');
                    selfCount();
                }
            });

            (<any>api).HugeParamsEmitter.Howl((err, res) => {
                if (err) error(err);
                if (howl == 0) {
                    info('HugeParamsEmitter.Howl executing result:');
                    howl = 1;
                    selfCount();
                }
            });
        });
    });
}

(function () {
    var sockPath = process.argv[2];
    trace('socketPath', sockPath);
    Initalize(sockPath);
})();