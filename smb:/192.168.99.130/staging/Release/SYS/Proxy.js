var net = require("net");
var APIConfig = require('./APIConfig');
var RPC = require('../Modules/RPC/index');
var moduleName = process.argv[2], modulePath = process.argv[3], socketPath = process.argv[4], funcidSet = {};
var moduleConfig = APIConfig.getModulesConfig()[moduleName], functions = moduleConfig['Functions'];
if (functions) {
    var _MODULE = require(modulePath);
    for (var p in functions) {
        if (_MODULE.hasOwnProperty(p) && typeof (_MODULE[p]) === 'function') {
            funcidSet[functions[p].funcid] = p;
        }
    }
    var sock = net.connect(socketPath, function () {
        var rpc = new RPC.RPCEndpoint(sock);
        rpc.SetFunctionHandler(function (fid, param, cb) {
            if (funcidSet[fid]) {
                var funcName = funcidSet[fid];
                console.log(funcName + '[' + fid + '] is called - ' + process.pid);
                var args = param.concat(cb);
                _MODULE[funcName].apply(null, args);
            }
        });
    });
}
