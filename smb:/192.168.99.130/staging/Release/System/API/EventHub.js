var func_e = require("./FunctionExposer");
var rpc = require("../../Modules/RPC/index");
var pm = require("./Permission");
var _api = rpc.APIManager;
var _handled_rpc_table = {};
var _remote_event_registry = {};
function AddToEventHub(id, rpc) {
    if (!id || !rpc)
        return;
    _handled_rpc_table[id] = {
        RPC: rpc,
        Perm: pm.GetPermission(id)
    };
    _remote_event_registry[id] = {};
}
exports.AddToEventHub = AddToEventHub;
function RemoveFromEventHub(id) {
    _handled_rpc_table[id] = undefined;
    _remote_event_registry[id] = undefined;
}
exports.RemoveFromEventHub = RemoveFromEventHub;
function __EVENT(path, permission) {
    _api.CreateEvent(pm.Encode(permission), path);
}
function __EMIT(path) {
    var data = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        data[_i - 1] = arguments[_i];
    }
    for (var dest in _remote_event_registry) {
        if (_handled_rpc_table[dest] && _remote_event_registry[dest][path] == 1) {
            _api.EmitEvent(_handled_rpc_table[dest].RPC, path, data);
        }
    }
}
function Remote_AddListener(event_list, callback) {
    var id = this.sender;
    if (!id || !_handled_rpc_table[id]) {
        return callback(new rpc.APIError("Permission Denied", "NOT_ALLOWED"));
    }
    if (!event_list) {
        return callback(new EvalError("Faulty Params"));
    }
    if (Array.isArray(event_list)) {
        var errs = [];
        var suc = [];
        for (var i = 0; i < event_list.length; i++) {
            var eobj = _api.GetEventObject(event_list[i]);
            if (!eobj) {
                suc.push(0);
                errs.push(new rpc.APIError("Event not found", "NOT_FOUND"));
                continue;
            }
            var owned = _handled_rpc_table[id].Perm;
            if (!pm.Check(owned, eobj.e)) {
                suc.push(0);
                errs.push(new rpc.APIError("Permission Denied", "NOT_ALLOWED", eobj.path));
                continue;
            }
            suc.push(1);
            _remote_event_registry[id][event_list[i]] = 1;
        }
        return callback(errs.length > 0 ? new Error(JSON.stringify(errs)) : undefined, suc);
    }
    else {
        var evobj = _api.GetEventObject(event_list);
        var perm = evobj.e;
        if (!evobj) {
            return callback(new rpc.APIError("Event not found", "NOT_FOUND"));
        }
        var owned = _handled_rpc_table[id].Perm;
        if (!pm.Check(owned, perm)) {
            return callback(new rpc.APIError("Permission Denied", "NOT_ALLOWED"));
        }
        _remote_event_registry[id][event_list] = 1;
        return callback(undefined, 1);
    }
}
__API(Remote_AddListener, "RegisterEvent", [2 /* Event */]);
global.__EVENT = __EVENT;
global.__EMIT = __EMIT;
