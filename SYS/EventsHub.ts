import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;
import pm = require('../System/API/Permission');

declare
function __EMIT(path:string,
                ...data);

// { eventId : [cb, ...] }
var eventCallbacks:{[key: number]: Array<any>} = {};

export function RegisterEventCallback(eventId, cb) {
    eventCallbacks[eventId] = eventCallbacks[eventId] || [];
    eventCallbacks[eventId].push(cb);
}
export function GetEventsCallbacks(eventId) {
    return eventCallbacks[eventId];
}

// { eventid: [pid [, ...]] }
var eventPidMapping:{[key: number]: Array<number>} = {};

function mapEventAndProcess(eventid, pid){
    if(!eventPidMapping[eventid]) eventPidMapping[eventid] = [];
    if(eventPidMapping[eventid].indexOf(pid) === -1)
        eventPidMapping[eventid].push(pid);
}

export function GetEventPids(event_id){
    return eventPidMapping[event_id];
};

export function RemoteAddEventListener(senderPid, event_id_list, callback) {
    if (!event_id_list && !Array.isArray(event_id_list)) {
        return callback(new EvalError("Faulty Params"));
    }
    //a try-best implementation
    var errs = [];
    var suc = [];
    var eventsConfig = APIConfig.getEventsConfig();
    for (var eventId in eventsConfig) {
        var eventInfo = eventsConfig[eventId];
        if (!eventInfo) {
            suc.push(0);
            errs.push(new RPC.APIError("Event not found", "NOT_FOUND"));
            continue;
        }
        if (!pm.Check(pm.GetPermission(senderPid), eventInfo.permission)) {
            suc.push(0);
            errs.push(new RPC.APIError("Permission Denied", "NOT_ALLOWED", eventInfo.path));
            continue;
        }
        suc.push(1);
        mapEventAndProcess(eventId, senderPid);
    }
    return callback(errs.length > 0 ? new Error(JSON.stringify(errs)) : undefined, suc);
}