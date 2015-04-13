require('./Env');
import net = require("net");
import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');
import APIManager = require('./APIManager');

var moduleName = process.argv[2]
    , modulePath = process.argv[3]
    , socketPath = process.argv[4]
    , funcidSet = {}; // { fid: funName }
process.env.apiConfigFilePath = process.argv[5];

trace('proxy argv', moduleName, modulePath, socketPath, process.env.apiConfigFilePath);

var moduleConfig = APIConfig.getModulesConfig()[moduleName]
    , functions = moduleConfig['Functions']
    , events = moduleConfig['Events'];
if (functions) {
    var _MODULE = require(modulePath);
    for (var p in functions) {
        if (_MODULE.hasOwnProperty(p) && typeof (_MODULE[p]) === 'function') {
            funcidSet[functions[p].funcid] = p;
        }
    }

    var sock = net.connect(socketPath, () => {
        var rpc = new RPC.RPCEndpoint(sock);
        rpc.SetFunctionHandler((fid, param, cb) => {
            if (funcidSet[fid]) {
                var funcName = funcidSet[fid];
                console.log(funcName + '[' + fid + '] is called - ' + process.pid);
                var args = param.concat(cb);
                _MODULE[funcName].apply(null, args);
            }
        });

        // for unit-testing: inject api into global
        global.api = APIManager.GetAPI(rpc).API;
        // for unit-testing: inject __EMIT into global
        global.__EMIT = (eventName, ...args) => {
            info('__EMIT remote - PID', process.pid);
            var eventsReverseConfig = APIConfig.getEventsReverseConfig();
            if(eventsReverseConfig && eventsReverseConfig[eventName]){
                var eventId = eventsReverseConfig[eventName].eventId;
                rpc.Emit(eventId, args);
            }
        };

    });

    process.on('exit', function () {
        trace('child process was exited, destory socket.');
        if (sock) sock.destroy();
    });
}
