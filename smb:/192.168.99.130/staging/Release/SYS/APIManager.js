var events = require("events");
var APIConfig = require('./APIConfig');
var _api_functions = [];
var _event_definitions = [];
var _event_reverse_lookup = {};
function RegisterFunction(funcBody, funcPath) {
    return _api_functions.push({
        f: funcBody,
        path: funcPath
    });
    ;
}
exports.RegisterFunction = RegisterFunction;
function CreateEvent(eObj, eventPath) {
    if (_event_reverse_lookup[eventPath])
        return -1;
    var num = _event_definitions.push({
        e: eObj,
        path: eventPath
    }) - 1;
    _event_reverse_lookup[eventPath] = num;
    return num;
}
exports.CreateEvent = CreateEvent;
function _incoming_function(funcId, params, cb) {
    if (!_api_functions[funcId]) {
        return cb(new Error("Function does not exist"), undefined);
    }
    var args = (Array.isArray(params) && params.push(cb)) ? params : [cb];
    _api_functions[funcId].f.apply({
        rpc: this
    }, args);
}
function ToJSON(func_filter, event_filter) {
    var result = {
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
exports.ToJSON = ToJSON;
function _method_shell(rpc, funcId, paramArray) {
    if (paramArray) {
        var cb = undefined;
        if (paramArray.length > 0 && typeof (paramArray[paramArray.length - 1]) === 'function') {
            cb = paramArray[paramArray.length - 1];
            paramArray.length--;
        }
        var arr = [];
        while (arr.length < paramArray.length)
            arr.push(paramArray[arr.length]);
        rpc.Call(funcId, arr, cb);
    }
    else {
        return;
    }
}
function GetAPI(rpc) {
    var apiConfig = APIConfig.getAPIConfig();
    var eventsConfig = APIConfig.getEventsConfig();
    var _API_Endpoint = {};
    _API_Endpoint.rpc_endpoint = rpc;
    _API_Endpoint.event_lookup = new Array(Object.keys(eventsConfig).length);
    _API_Endpoint.Destroy = (function () {
        _API_Endpoint.rpc_endpoint = undefined;
        _API_Endpoint.event_lookup = undefined;
        while (_API_Endpoint.event_tracker.length > 0) {
            _API_Endpoint.event_tracker.pop().removeAllListeners();
        }
        _API_Endpoint.event_tracker = undefined;
        _API_Endpoint.API = undefined;
    });
    var API = new events.EventEmitter();
    var _event_tracker = [API];
    for (var i in eventsConfig) {
        var d = i.split('.');
        var cur = API;
        if (d.length > 1) {
            for (var t = 0; t < d.length - 2; t++) {
                if (!cur[d[t]]) {
                    cur[d[t]] = {};
                }
                cur = cur[d[t]];
            }
            var ev = new events.EventEmitter();
            _event_tracker.push(ev);
            cur[d[d.length - 2]] = ev;
            cur = cur[d[d.length - 2]];
        }
        var event_name = d[d.length - 1] + "";
        _API_Endpoint.event_lookup[i] = { emitter: cur, name: event_name };
    }
    for (var i in apiConfig) {
        var d = i.split('.');
        var cur = API;
        for (var t = 0; t < d.length - 1; t++) {
            if (!cur[d[t]]) {
                cur[d[t]] = {};
            }
            cur = cur[d[t]];
        }
        cur[d[d.length - 1]] = (function (i) {
            return function () {
                _method_shell(_API_Endpoint.rpc_endpoint, i, arguments);
            };
        })(i);
    }
    rpc.SetEventHandler(function (event_id, paramArray) {
        if (_API_Endpoint.event_lookup && _API_Endpoint.event_lookup[event_id] && _API_Endpoint.event_lookup[event_id].emitter && _API_Endpoint.event_lookup[event_id].name) {
            _API_Endpoint.event_lookup[event_id].emitter.emit.apply(_API_Endpoint.event_lookup[event_id].emitter, [
                _API_Endpoint.event_lookup[event_id].name
            ].concat(paramArray));
        }
    });
    _API_Endpoint.API = API;
    _API_Endpoint.event_tracker = _event_tracker;
    return _API_Endpoint;
}
exports.GetAPI = GetAPI;
function ServeAPI(rpc) {
    rpc.SetFunctionHandler(_incoming_function);
}
exports.ServeAPI = ServeAPI;
function EmitEvent(rpc, eventPath, params) {
    rpc.Emit(_event_reverse_lookup[eventPath], params);
}
exports.EmitEvent = EmitEvent;
function GetEventObject(eventPath) {
    if (_event_reverse_lookup[eventPath] + 1 <= _event_reverse_lookup[eventPath])
        return undefined;
    if (!_event_definitions[_event_reverse_lookup[eventPath]])
        return undefined;
    return _event_definitions[_event_reverse_lookup[eventPath]];
}
exports.GetEventObject = GetEventObject;
