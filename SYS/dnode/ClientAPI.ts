import util = require("util");
import net = require('net');
import events = require("events");
import RPC = require('../../Modules/RPC/index');
import APIConfig = require('./APIConfig');
import _MountTable = require('./MountTable');
import pm = require('../../System/API/Permission');
import MountTable = _MountTable.MountTable;

var dnode = require('dnode');

export interface API_Endpoint {
    API: any;
    Destroy: Function;
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
    } else {
        //bad method call
        return;
    }
}


export function GetAPI(sockPath:string):API_Endpoint {
    var apiConfig = APIConfig.getAPIConfig();
    var eventsConfig = APIConfig.getEventsConfig();

    var _API_Endpoint:any = {};
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

    function _destory(){
        for(var i=0, len= _event_tracker.length; i< len ;i++){
            _event_tracker[i].removeAllListeners();
        }
        process.kill(process.pid);
    }

    _API_Endpoint.API = API;
    return _API_Endpoint;
}