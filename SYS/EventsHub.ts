import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;
import pm = require('../System/API/Permission');
import events = require('events');

declare
function __EMIT(path:string,
                ...data);

// { eventId : eventEmitter }
var localEventsTracker:{[key: number]: events.EventEmitter } = {};


// { eventid: [pid [, ...]] }
var remoteEventPidMapping:{[key: number]: Array<number>} = {};

function remoteMapEventAndProcess(eventid, pid){
    if(!remoteEventPidMapping[eventid]) remoteEventPidMapping[eventid] = [];
    if(remoteEventPidMapping[eventid].indexOf(pid) === -1)
        remoteEventPidMapping[eventid].push(pid);
}

export function RemoteGetEventPids(event_id){
    return remoteEventPidMapping[event_id];
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
        remoteMapEventAndProcess(eventId, senderPid);
    }
    return callback(errs.length > 0 ? new Error(JSON.stringify(errs)) : undefined, suc);
}