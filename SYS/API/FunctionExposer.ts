// This module creates closure for the raw API Manager (adding permission control)

import rpc = require("../../Modules/RPC/index");
import pm = require("./Permission");
var _api = rpc.APIManager;

interface _Function_With_Permission_Token extends Function {
    _p: any[];
}

function __API(
    func: _Function_With_Permission_Token,
    path: string,
    permission?: Permission[]) {
    //Generates a permission based closure
    var perm = pm.Encode(permission);

    if (global.trace) {
        trace("EXPOSE " + path);
    }
    func._p = perm;
    var shell = function (...params) {
        if (CONF.IS_DEBUG && CONF.RPC_FUNC_LOG) {
            trace("* " + path);
        }
        var args = arguments;
        var rpc = (<rpc.RPCEndpoint>this.rpc);
        var sender = this.sender = rpc["remote"]; //from RPC call
        if (!pm.Check(pm.GetPermission(sender), func._p)) {
            return args[args.length - 1](new EvalError("Permission Denied"));
        }
        func.apply(this, arguments);
    }
    shell["_p"] = perm; //for outer access
    _api.RegisterFunction(shell, path);
}

global.__API = __API;

