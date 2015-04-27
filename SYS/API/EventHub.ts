import rpc = require("../../Modules/RPC/index");
import pm = require("./Permission");
import async = require("async");

var _api = rpc.APIManager;

var _handled_rpc_table: {
    RPC: rpc.RPCEndpoint;
    Perm: any[];
}[] = <any>{}; // SENDER_KEY <-> Permission, RPC_SOCK

var _remote_event_registry = {}; // SENDER_KEY <-> EVENT_PATH

export function AddToEventHub(id: any, rpc: rpc.RPCEndpoint) {
    if (!id || !rpc) return;
    _handled_rpc_table[id] = {
        RPC: rpc,
        Perm: pm.GetPermission(id)
    };
    _remote_event_registry[id] = {};
}

export function RemoveFromEventHub(id: any) {
    _handled_rpc_table[id] = undefined; //faster than delete
    _remote_event_registry[id] = undefined;
}

function __EVENT(
    path: string,
    permission?: Permission[]) {
    _api.CreateEvent(pm.Encode(permission), path);
}

function __EMIT(
    path: string,
    ...data) {

    //Actually Emit this event
    for (var dest in _remote_event_registry) {
        if (_handled_rpc_table[dest] && _remote_event_registry[dest][path] == 1) {
            //Emit!
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
        //a try-best implementation
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

__API(Remote_AddListener, "RegisterEvent", [Permission.Event]);

global.__EVENT = __EVENT;
global.__EMIT  = __EMIT;
