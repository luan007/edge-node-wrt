import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;

// eventId : [rpc, ...]
var eventsMapping = {};

declare function __EMIT(
    path: string,
    ...data);

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