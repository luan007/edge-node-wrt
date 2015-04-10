require('./Env');
import net = require("net");
import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');

var moduleName = process.argv[2]
    , modulePath = process.argv[3]
    , socketPath = process.argv[4]
    , funcidSet = {}; // { fid: funName }

info('proxy argv', moduleName, modulePath, socketPath);

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
        events.forEach(function(eventName){ // register events
            _MODULE.on(eventName, () => {
                rpc.emit(eventName, arguments);
            });
        });
    });

    process.on('exit', function(){
        trace('child process was exited, destory socket.');
        if(sock) sock.destroy();
    });
}
