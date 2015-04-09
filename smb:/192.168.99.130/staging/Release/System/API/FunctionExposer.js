var rpc = require("../../Modules/RPC/index");
var pm = require("./Permission");
var _api = rpc.APIManager;
function __API(func, path, permission) {
    var perm = pm.Encode(permission);
    if (global.trace) {
        trace("EXPOSE " + path);
    }
    func._p = perm;
    var shell = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        if (CONF.IS_DEBUG && CONF.RPC_FUNC_LOG) {
            trace("* " + path);
        }
        var args = arguments;
        var rpc = this.rpc;
        var sender = this.sender = rpc["remote"];
        if (!pm.Check(pm.GetPermission(sender), func._p)) {
            return args[args.length - 1](new EvalError("Permission Denied"));
        }
        func.apply(this, arguments);
    };
    shell["_p"] = perm;
    _api.RegisterFunction(shell, path);
}
global.__API = __API;
