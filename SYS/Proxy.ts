require('./Env');
import net = require("net");
import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');
import APIManager = require('./APIManager');
import events = require('events');

var moduleName = process.argv[2]
    , modulePath = process.argv[3]
    , socketPath = process.argv[4]
    , funcidSet = {}; // { fid: funName }
process.env.apiConfigFilePath = process.argv[5];
process.env.NODE_PATH = process.argv[6];

trace('proxy argv', moduleName, modulePath, socketPath, process.env.apiConfigFilePath);

var moduleConfig = APIConfig.getModulesConfig()[moduleName]
    , moduleFunctions = moduleConfig['Functions'];
if (moduleFunctions) {
    global.__module__ = new events.EventEmitter();

    var _MODULE = require(path.join(process.env.NODE_PATH, modulePath));
    for (var p in moduleFunctions) {
        if (_MODULE.hasOwnProperty(p) && typeof (_MODULE[p]) === 'function') {
            funcidSet[moduleFunctions[p].funcid] = p;
        }
    }

    var sock = net.connect(socketPath, () => {
        var rpc = new RPC.BinaryRPCEndpoint(sock);
        rpc.SetFunctionHandler((fid, param, cb) => {
            if (funcidSet[fid]) {
                var funcName = funcidSet[fid];
                //console.log(funcName + '[' + fid + '] was called - ' + process.pid);
                var args = param.concat(cb);
                _MODULE[funcName].apply(null, args);
            }
        });
        function destory(){
            process.kill(process.pid);
        }
        rpc.once('close', destory);
        rpc.once('error', destory);

        // for unit-testing: inject api into global
        global.api = APIManager.GetAPI(rpc).API;
        // for unit-testing: inject __EMIT into global
        global.__EMIT = (eventName, ...args) => {
            info('__EMIT remote - PID', process.pid, 'eventName', eventName);
            var eventsReverseConfig = APIConfig.getEventsReverseConfig();
            if(eventsReverseConfig && eventsReverseConfig[eventName]){
                var eventId = eventsReverseConfig[eventName].eventId;
                rpc.Emit(eventId, args);
                //EventsHub.RemoteEmit(rpc, eventId, args);
            }
        };

        global.__module__.emit('loaded');
    });

    process.on('exit', function () {
        trace('child process was exited, destory socket.');
        global.__module__.removeAllListeners();
        global.__module__ = undefined;
        if (sock) sock.destroy();
    });
}
