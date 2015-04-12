import util = require("util");
import events = require("events");
import RPC = require('../Modules/RPC/index');
import APIConfig = require('./APIConfig');
import EventsHub = require('./EventsHub');
import _MountTable = require('./MountTable');
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

function _method_shell(rpc:RPC.RPCEndpoint, funcId, paramArray:any[]) {
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
export function GetAPI(rpc:RPC.RPCEndpoint):API_Endpoint {
    var apiConfig = APIConfig.getAPIConfig();
    var eventsConfig = APIConfig.getEventsConfig();
    var eventsReverseConfig = APIConfig.getEventsReverseConfig();

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

    for (var eventId in eventsConfig) { // { eventId: { moduleName, eventName, permission } [, ...] }
        var moduleEntry = eventsConfig[eventId];
        var moduleName = moduleEntry['moduleName'];
        if (!API[moduleName]) {
            API[moduleName] = {};
            API[moduleName]['ON'] = (eventName:string, cb:Function) => {
                trace('ON ----------' + eventName);
                var eventInfo = eventsReverseConfig[eventName];
                trace('ON ----------' + eventInfo);
                if (eventInfo) {
                    trace('ON ---------- ' + eventName + ' ' + eventInfo.eventId);
                    // RETRIEVE RPC
                    var remoteRPC = MountTable.GetByEventId(eventInfo.eventId).rpc;
                    //trace('remoteRPC', require('util').inspect(remoteRPC));
                    //remoteRPC.Subscribe(eventInfo.eventId, cb);
                    //EventsHub.RegisterEvent(eventInfo.eventId, _API_Endpoint.rpc_endpoint);
                    EventsHub.RegisterEventCallback(eventInfo.eventId, cb);
                    _API_Endpoint.event_lookup[eventInfo.eventId] = _API_Endpoint.event_lookup[eventInfo.eventId] || [];
                    _API_Endpoint.event_lookup[eventInfo.eventId].push(cb);
                }
            };
        }
    }

    for (var funcid in apiConfig) { //  { funcId: { moduleName, funcName, permission } [, ...] }
        //i = API.System.Device.DummyFunc
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

    trace('events shadow assembling', require('util').inspect(API));

    rpc.SetEventHandler((event_id, paramArray:any[]) => {
        if (_API_Endpoint.event_lookup && _API_Endpoint.event_lookup[event_id].length > 0) {
            trace('Event handler triggered-----------', _API_Endpoint.event_lookup);
            (<Array<Function>>_API_Endpoint.event_lookup[event_id]).forEach(function (cb:Function) {
                cb.apply(null, paramArray);
            });
        }
    });

    _API_Endpoint.API = API;
    _API_Endpoint.event_tracker = _event_tracker;
    return _API_Endpoint;
}


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