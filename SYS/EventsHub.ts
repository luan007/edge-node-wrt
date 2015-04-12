import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;

// eventId : [rpc, ...]
var eventsMapping = {};

declare function EMIT(
    path: string,
    ...data);

//export function EMIT(eventName, params:any[]) {
//    var eventsReverseConfig = APIConfig.getEventsReverseConfig();
//    if((process.env.rpc && eventsReverseConfig && eventsReverseConfig[eventName]) {
//        var eventId = eventsReverseConfig[eventName].eventId;
//        process.env.rpc.
//    }
//
//    //if(eventInfo && eventsMapping[eventInfo.eventId]) {
//    //    var rpcs = eventsMapping[eventInfo.eventId];
//    //    rpcs.forEach(function (rpc:RPC.RPCEndpoint) {
//    //        rpc.Emit(eventInfo.eventId, params);
//    //    });
//    //}
//}

var eventCallbacks:{[key: number]: Array<Function>} = {};

export function RegisterEventCallback(eventId, cb){
    eventCallbacks[eventId] = eventCallbacks[eventId] || [];
    eventCallbacks[eventId].push(cb);
}
export function GetEventsCallbacks(eventId){
    return eventCallbacks[eventId];
}

export function RegisterEvent(eventId, rpc:RPC.RPCEndpoint){
    if(!eventsMapping[eventId])
        eventsMapping[eventId] = [];
    eventsMapping[eventId].push(rpc);
    trace('RegisterEvent ---------- ' + require('util').inspect(eventsMapping) + ' ' + eventId);
}
export function RemoveEvent(eventId){
    if(eventsMapping[eventId])
        delete eventsMapping[eventId];
}