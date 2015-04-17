import util = require("util");
import net = require('net');
import events = require("events");
import RPC = require('../Modules/RPC/index');
import APIConfig = require('./APIConfig');
import EventsHub = require('./EventsHub');
import _MountTable = require('./MountTable');
import pm = require('../System/API/Permission');
import MountTable = _MountTable.MountTable;

export interface API_Endpoint {
    API: any;
    Destroy: Function;
}

var _api_functions:{
    f: Function;
    path: string;
}[] = [];

var _event_definitions:{
    e: any; /*for permission tagging*/
    path: string;
}[] = [];

var _event_reverse_lookup = {};

export function RegisterFunction(funcBody, funcPath):number {
    return _api_functions.push({
        f: funcBody,
        path: funcPath
    });
    ;
}

export function CreateEvent(eObj, eventPath):number {
    if (_event_reverse_lookup[eventPath])
        return -1;
    var num = _event_definitions.push({
            e: eObj,
            path: eventPath
        }) - 1;
    _event_reverse_lookup[eventPath] = num;
    return num;
}

/*This method should be called inside generic invoke-entry*/ //INCOMING
function _incoming_function(funcId, params, cb) {
    if (!_api_functions[funcId]) {
        return cb(new Error("Function does not exist"), undefined);
    }
    var args = (Array.isArray(params) && params.push(cb)) ? params : [cb];
    //if (params) {
    //    var keys = Object.keys(params);
    //    for (var i = 0; i < keys.length; i++) {
    //        args.push(params[keys[i]]);
    //    }
    //}
    //args.push(cb);
    //console.log(_api_functions[funcId]);
    _api_functions[funcId].f.apply({
        rpc: this
    }, args);
}


//Exports API JSON
export function ToJSON(func_filter?:(f:Function, path:string) => boolean,
                       event_filter?:(e:any, path:string) => boolean):string {
    //   { "API_NAME" : index }
    var result:any = {
        f: {},
        e: {}
    };
    for (var i = 0; i < _api_functions.length; i++) {
        if (!func_filter || func_filter(_api_functions[i].f, _api_functions[i].path)) {
            result.f[_api_functions[i].path] = i;
        }
    }

    for (var i = 0; i < _event_definitions.length; i++) {
        if (!event_filter || event_filter(_event_definitions[i].e, _event_definitions[i].path)) {
            result.e[_event_definitions[i].path] = i;
        }
    }
    return JSON.stringify(result);
}

function _event_shell(rpc:RPC.RPCEndpoint, eventId, paramArray:any[]) {
    if (paramArray) {
        rpc.Emit(eventId, paramArray);
    } else {
        return;
    }
}

function _method_shell(rpc:RPC.BinaryRPCEndpoint, funcId, paramArray:any[]) {
    if (paramArray) {
        //check for callback if there's any
        var cb:Function = undefined;
        if (paramArray.length > 0 && typeof (paramArray[paramArray.length - 1]) === 'function') {
            cb = paramArray[paramArray.length - 1]; //fast op, remove last one as callback
            paramArray.length--;
        }
        var arr = [];
        while (arr.length < paramArray.length) arr.push(paramArray[arr.length]);

        //cb CAN be undefined.
        rpc.Call(funcId, arr, cb);
    } else {
        //bad method call
        return;
    }
}

//event_id -> emitter + eventname

//Returns Shadow
export function GetAPI(rpc:RPC.BinaryRPCEndpoint):API_Endpoint {
    var apiConfig = APIConfig.getAPIConfig();
    var eventsConfig = APIConfig.getEventsConfig();

    var _API_Endpoint:any = {};
    _API_Endpoint.rpc_endpoint = rpc;
    _API_Endpoint.event_lookup = {}; //new Array(Object.keys(eventsConfig).length);
    _API_Endpoint.Destroy = (() => {
        _API_Endpoint.rpc_endpoint = undefined;
        _API_Endpoint.event_lookup = undefined;
        //sweep, mark, kill
        while (_API_Endpoint.event_tracker.length > 0) {
            (<events.EventEmitter> _API_Endpoint.event_tracker.pop()).removeAllListeners();
        }
        _API_Endpoint.event_tracker = undefined;
        _API_Endpoint.API = undefined;
    });
    //Really generates API object
    var API = new events.EventEmitter();
    var _event_tracker = [API];

    for (var eventId in eventsConfig) {
        var fullPath = eventsConfig[eventId].moduleName + '.' + eventsConfig[eventId].eventName;
        var d = (<string>fullPath).split('.');
        //recur gen func tree
        var cur = API;
        if (d.length > 1) {
            for (var t = 0; t < d.length - 2; t++) {
                if (!cur[d[t]]) {
                    cur[d[t]] = {};
                }
                cur = cur[d[t]];
            }
            if(!cur[d[d.length - 2]]) {
                var ev = new events.EventEmitter();
                _event_tracker.push(ev);
                cur[d[d.length - 2]] = ev;
                cur = cur[d[d.length - 2]];
            }
            else{
                cur = cur[d[d.length - 2]];
            }
        }
        var event_name = d[d.length - 1] + "";
        _API_Endpoint.event_lookup[eventId] = {emitter: cur, name: event_name};
    }

    for (var funcid in apiConfig) {
        //  { funcId: { moduleName, funcName, permission } [, ...] }
        var moduleEntry = apiConfig[funcid];
        var d = (<string>moduleEntry['moduleName']).split('.');
        //recur gen func tree
        var cur = API;
        for (var t = 0, len = d.length; t < len; t++) {
            if (!cur[d[t]]) {
                cur[d[t]] = {} //Considerable?
                //_event_tracker.push(cur[d[t]]); 
            }
            cur = cur[d[t]];
        }
        cur[moduleEntry['funcName']] = ((funcid) => {
            return function () {
                _method_shell(_API_Endpoint.rpc_endpoint, funcid, <any>arguments);
            }
        })(funcid);
    }

    rpc.SetEventHandler((event_id, paramArray:any[]) => {
        var event_found = _API_Endpoint.event_lookup[event_id];
        if (event_found) {
            var emitter = (<events.EventEmitter>event_found.emitter);
            var eventName = event_found.name;
            emitter.emit.apply(emitter, [eventName].concat(paramArray));
        }
    });

    function _destory(){
        for(var i=0, len= _event_tracker.length; i< len ;i++){
            _event_tracker[i].removeAllListeners();
        }
        rpc.Destroy();
        process.kill(process.pid);
    }
    rpc.once('error', _destory);
    rpc.once('close', _destory);

    API['RegisterEvent'] = (event_name_list:Array<string>, callback:Function) => {
        warn('client RegisterEvent', event_name_list);
        var eventsReverseConfig = APIConfig.getEventsReverseConfig();
        var event_id_list = [];
        for (var i = 0, len = event_name_list.length; i < len; i++) {
            var eventInfo = eventsReverseConfig[event_name_list[i]];
            if (eventInfo)
                event_id_list.push(eventInfo.eventId);
        }
        if (event_id_list.length > 0)
            rpc.Call(0, event_id_list, callback);
        else
            callback(new Error('Faulty Params'));
    }

    API['UnRegisterEvent'] = (event_name_list:Array<string>, callback:Function) => {
        warn('client UnRegisterEvent', event_name_list);
        var eventsReverseConfig = APIConfig.getEventsReverseConfig();
        var event_id_list = [];
        for (var i = 0, len = event_name_list.length; i < len; i++) {
            var eventInfo = eventsReverseConfig[event_name_list[i]];
            if (eventInfo)
                event_id_list.push(eventInfo.eventId);
        }
        if (event_id_list.length > 0)
            rpc.Call(-1, event_id_list, callback);
        else
            callback(new Error('Faulty Params'));
    }

    _API_Endpoint.API = API;
    _API_Endpoint.event_tracker = _event_tracker;
    return _API_Endpoint;
}

export function Connect(sockPath, cb){
    try{
        var sock = net.connect(sockPath, () => {
            var rpc = new RPC.BinaryRPCEndpoint(sock);
            var api = GetAPI(rpc).API;
            cb(null, api);
        });
    } catch (err){
        cb(err, null);
    }
};

export function ServeAPI(rpc:RPC.RPCEndpoint) {
    rpc.SetFunctionHandler(_incoming_function);
}

export function EmitEvent(rpc:RPC.RPCEndpoint, eventPath, params:any[]) {
    rpc.Emit(_event_reverse_lookup[eventPath], params);
}

export function GetEventObject(eventPath):any {
    if (_event_reverse_lookup[eventPath] + 1 <= _event_reverse_lookup[eventPath])
        return undefined;
    if (!_event_definitions[_event_reverse_lookup[eventPath]])
        return undefined;
    return _event_definitions[_event_reverse_lookup[eventPath]];
}

//export function __dump() {
//    console.log("API Dump");
//    console.log(_api_functions);
//    console.log("Event Dump");
//    console.log(_event_definitions);
//}