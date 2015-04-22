require('./Env');
import net = require("net");
import APIConfig = require('./APIConfig');
import RPC = require('../../Modules/RPC/index');
import sockPath = require('../../System/Lib/Sockets/SockPath');
import ClientAPI = require('./ClientAPI');
import events = require('events');

var dnode = require('dnode');

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
    sockPath.Initialize();
    global.__module__ = new events.EventEmitter();

    var _MODULE = require(path.join(process.env.NODE_PATH, modulePath));
    for (var p in moduleFunctions) {
        if (_MODULE.hasOwnProperty(p) && typeof (_MODULE[p]) === 'function') {
            funcidSet[moduleFunctions[p].funcid] = p;
        }
    }

    var localSockPath = getSock(UUIDstr());
    var server = net.createServer(function (c) {
        var d = dnode({
            invoke : function (funcid, params, cb) {
                if (funcidSet[funcid]) {
                    var funcName = funcidSet[funcid];
                    var args = params.concat(cb);
                    _MODULE[funcName].apply(null, args);
                }
            }
        });
        c.pipe(d).pipe(c);
    });
    server.listen(localSockPath,  () => {
        exec("chown", "nobody", localSockPath, () => {
            exec("chmod", "777", localSockPath, () => {
                console.log("service API Port Permission is set");

                registerServer(localSockPath);
            });
        });
    });

    process.on('exit', function () {
        trace('child process was exited, destory socket.');
        global.__module__.removeAllListeners();
        global.__module__ = undefined;
    });
}

function registerServer(localSockPath){
    var d = dnode();
    d.on('remote', (remote)=> {
        remote.registerServer(localSockPath, () => {
            global.api = ClientAPI.GetAPI(socketPath).API;
            // for unit-testing: inject __EMIT into global
            global.__EMIT = (eventName, ...args) => {
                info('__EMIT remote - PID', process.pid, 'eventName', eventName);
                var eventsReverseConfig = APIConfig.getEventsReverseConfig();
                if (eventsReverseConfig && eventsReverseConfig[eventName]) {
                    var eventId = eventsReverseConfig[eventName].eventId;

                    //EventsHub.RemoteEmit(rpc, eventId, args);
                }
            };

            global.__module__.emit('loaded');
        });
    });
    var c = net.connect(socketPath);
    c.pipe(d).pipe(c);
}