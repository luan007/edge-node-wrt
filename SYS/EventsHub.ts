import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;

declare function __EMIT(
    path: string,
    ...data);

// { eventId : [cb, ...] }
var eventCallbacks:{[key: number]: Array<Function>} = {};

export function RegisterEventCallback(eventId, cb){
    eventCallbacks[eventId] = eventCallbacks[eventId] || [];
    eventCallbacks[eventId].push(cb);
}
export function GetEventsCallbacks(eventId){
    return eventCallbacks[eventId];
}