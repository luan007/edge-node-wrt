// This module creates closure for the raw API Manager (adding permission control)
eval(LOG("API:FunctionExposer"));

import rpc = require("../../Modules/RPC/index");
import pm = require("./Permission");
//import UserManager = require('../User/UserManager');
import TokenManager = require('./TokenManager');
var _api = rpc.APIManager;

export var APIDict = {};

interface _Function_With_Permission_Token extends Function {
    _p: any[];
}

var callNUM = 0;

function __API(func,
               path:string,
               permission?:Permission[],
               needUsersAuthorization?:boolean) {
    //Generates a permission based closure
    var perm = pm.Encode(permission);

    if (trace) {
        trace("EXPOSE " + path);
    }
    //func._p = perm;

    //if(path === 'Proxy.CurrentDevHeader'){
    //    fatal('===========>> set permission', path, permission, perm);
    //}

    var shell = function (...params) {
        var args = [].slice.call(arguments);
        if (CONF.IS_DEBUG && CONF.RPC_FUNC_LOG) {
            var tracer = callNUM++;
            trace(" [*] " + tracer + " " + path);
            if(args[args.length - 1] instanceof Function){
                var a = args[args.length - 1];
                args[args.length - 1] = function() {
                    trace(" [R] " + tracer + " " + JSON.stringify([].slice.call(arguments)));
                    a.apply(this, arguments);
                }
            }
        }
        var rpc = (<rpc.RPCEndpoint>this.rpc);
        var sender = this.sender = rpc["remote"]; //from RPC call
        if (!pm.Check(pm.GetPermission(sender), shell['_p'])) {
            return args[args.length - 1](new EvalError("Permission Denied"));
        }

        if (needUsersAuthorization) { // need user's authorization
            if(!this.webex) {
                var token_uid = args.shift();
                if (typeof token_uid !== 'string'){
                    return args[args.length - 1](new EvalError("Invalid Access Token."));
                }
                if (token_uid.trim() === '') {
                    return args[args.length - 1](new EvalError("Permission Denied"));
                }
                if (!TokenManager.Verify(token_uid)) {
                    return args[args.length - 1](new EvalError("Invalid Access Token."));
                }
                var token = TokenManager.GetUserToken(token_uid);
                //WHY DO WE NEED THESE ????
                // var ticket = require('../User/UserManager').DB_Ticket[atoken];
                // if (!ticket && ticket.uid) {
                //     return args[args.length - 1](new EvalError("Invalid Access Token."));
                // }
                // var user = require('../User/UserManager').DB_UserList[ticket.uid];
                // if (!user) {
                //     return args[args.length - 1](new EvalError("Invalid Access Token."));
                // }
                this.deviceid = token.devid;
                this.userid = token.userid;
                //this.tokenid = token_uid;
                // console.log('user credential'['blueBG'].bold, token_uid, ticket.uid, user.name);
            } else {
                this.deviceid = this.webex.deviceid;
                this.userid = this.webex.userid;
            }
        }

        func.apply(this, args);
    }
    shell["_p"] = perm; //for outer access
    _api.RegisterFunction(shell, path);
    APIDict[path.toLowerCase()] = function safety () { 
        try{
            shell.apply(this, arguments);
        } catch(e) {
            var args = [].slice.call(arguments);
            if(args.length && args[args.length - 1] instanceof Function){
                args[args.length - 1](e);
            }
        }
    };
}

global.__API = __API;




__API((cb)=>{
    cb(undefined, "Hello");
}, "Hello");