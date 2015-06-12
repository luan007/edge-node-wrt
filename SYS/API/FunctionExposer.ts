﻿// This module creates closure for the raw API Manager (adding permission control)

import rpc = require("../../Modules/RPC/index");
import pm = require("./Permission");
//import UserManager = require('../User/UserManager');
import TokenManager = require('../User/TokenManager');
var _api = rpc.APIManager;

interface _Function_With_Permission_Token extends Function {
    _p: any[];
}

function __API(func:_Function_With_Permission_Token,
               path:string,
               permission?:Permission[],
               needUsersAuthorization?:boolean) {
    //Generates a permission based closure
    var perm = pm.Encode(permission);

    if (global.trace) {
        trace("EXPOSE " + path);
    }
    //func._p = perm;

    //if(path === 'Proxy.CurrentDevHeader'){
    //    fatal('===========>> set permission', path, permission, perm);
    //}

    var shell = function (...params) {
        if (CONF.IS_DEBUG && CONF.RPC_FUNC_LOG) {
            trace("* " + path);
        }
        var args = [].slice.call(arguments);
        var rpc = (<rpc.RPCEndpoint>this.rpc);
        var sender = this.sender = rpc["remote"]; //from RPC call
        //fatal('===========<< get permission', path, pm.GetPermission(sender), permission, func._p);
        if (!pm.Check(pm.GetPermission(sender), shell['_p'])) {
            return args[args.length - 1](new EvalError("Permission Denied"));
        }

        var token_uid = '';
        if (/token_uid:/.test(args[0])) {
            token_uid = args.shift().split('token_uid:')[1];
            console.log('detected token uid'['blueBG'].bold, token_uid);
        }
        if (needUsersAuthorization) { // need user's authorization
            if (token_uid.trim() === '') {
                return args[args.length - 1](new EvalError("Permission Denied"));
            }
            if (!TokenManager.Verify(token_uid)) {
                return args[args.length - 1](new EvalError("Invalid Access Token."));
            }
            var atoken = TokenManager.GetUserToken(token_uid);
            var uid = require('../User/UserManager').DB_Ticket[atoken].uid;
            var user = require('../User/UserManager').DB_UserList[uid];
            args.unshift({ // pass user as first argument
                name: user.name
            });
            console.log('usercredential'['blueBG'].bold, token_uid, uid, user.name);
        }

        func.apply(this, args);
    }
    shell["_p"] = perm; //for outer access
    _api.RegisterFunction(shell, path);
}

global.__API = __API;

