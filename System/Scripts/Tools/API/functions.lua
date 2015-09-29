require 'permission'
local dbg = require('dbg')('api.function')

local exports = {
    paths = {},
    functions = {},
    functionPerms = {},
    flags = {}
}

function exports.oncall(remoteid, funcId, params, cb)
    -- not using error, cuz that's gonna be slow and unsafe
    if not (exports.functions[funcId]) then
        return cb("Method Not Found " .. fundId)
    end
    if not PermissionOps.Check(PermissionOps.Get(remoteid), exports.functionPerms[funcId]) then
        return cb("Permission Denied")
    end
    params = params and params or {}
    local context = {
        id = remoteid
    }
    if(not exports.flags[funcId] or not exports.flags[funcId].withoutCb) then
        params[#params + 1] = cb
    end
    return exports.functions[funcId](context, unpack(params))
end

function __API(func, path, permission, flags)
    local id = #exports.functions + 1
    exports.paths[path] = id
    exports.functions[id] = func
    exports.functionPerms[id] = PermissionOps.Encode(permission)
    exports.flags[id] = flags
    dbg("Expose" .. " #" .. id .. " " .. path)
end

function DumpFunctions()
    return exports.paths
end

return exports
--
--import pm = require("./Permission");
--export var Functions = [];
--
--export function oncall(socket, frame: any[], cb) {
--    var funcId = frame.shift();
--var param = frame.shift();
--if (!Functions[funcId]) {
--    funcId = param = frame = undefined;
--return cb(new Error("Method not Found"));
--}
--
--//now let's check sender
--var peer = socket['remote'];
--var funcObj = Functions[funcId];
--
--if (!pm.Check(pm.GetPermission(peer), funcObj.permission)) {
--return cb(new Error("Permission Denied"));
--}
--
--var context = {
--    remote: socket.remote,
--    sender: socket.sender, //compatibility
--type: socket.type
--};
--
--if (funcObj.userAuth) {
--    error("User-Authentication is not implemented in new Function API Exposer!");
--return cb(new Error("User Authentication is not Implemented yet!"));
--//             if(!this.webex) {
--    //                 var token_uid = args.shift();
--//                 if (typeof token_uid !== 'string'){
--    //                     return args[args.length - 1](new EvalError("Invalid Access Token."));
--//                 }
--//                 if (token_uid.trim() === '') {
--    //                     return args[args.length - 1](new EvalError("Permission Denied"));
--//                 }
--//                 if (!TokenManager.Verify(token_uid)) {
--    //                     return args[args.length - 1](new EvalError("Invalid Access Token."));
--//                 }
--//                 var token = TokenManager.GetUserToken(token_uid);
--//                 this.deviceid = token.devid;
--//                 this.userid = token.userid;
--//                 //this.tokenid = token_uid;
--//                 // console.log('user credential'['blueBG'].bold, token_uid, ticket.uid, user.name);
--//             } else {
--    //                 this.deviceid = this.webex.deviceid;
--//                 this.userid = this.webex.userid;
--//             }
--
--//fill in the context please...
--}
--param = param || [];
--param.push(cb);
--return Functions[funcId].func.apply(context, param);
--}
--
--function __API(func,
--path: string,
--permission?: Permission[],
--needUsersAuthorization?: boolean) {
--    //Generates a permission based closure
--//nope, no more.
--var perm = pm.Encode(permission);
--debug("EXPOSE " + path);
--Functions.push({
--    path: path,
--    func: func,
--    permission: perm,
--    userAuth: needUsersAuthorization
--})
--}
--
--global['__API'] = __API;
--
--__API((cb) => {
--    cb(undefined, "Hello");
--}, "Hello");