import APIConfig = require('./APIConfig');
import RPC = require('../Modules/RPC/index');
import _MountTable = require('./MountTable');
import MountTable = _MountTable.MountTable;
import pm = require('../System/API/Permission');
import events = require('events');

// { eventid: [pid [, ...]] }
var remoteEventPidMapping:{[key: number]: Array<number>} = {};

function remoteMapEventAndProcess(eventid, pid) {
    if (!remoteEventPidMapping[eventid]) remoteEventPidMapping[eventid] = [];
    if (remoteEventPidMapping[eventid].indexOf(pid) === -1)
        remoteEventPidMapping[eventid].push(pid);
}

export function RemoteGetEventPids(event_id) {
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

export function RemoteRemoveEventPid(senderPid, event_id_list, callback) {
    for (var j = 0, len = event_id_list.length; j < len; j++) {
        var event_id = event_id_list[j];
        if (remoteEventPidMapping[event_id]) {
            warn('remove remote event pid maping ======', senderPid, event_id);
            var i = remoteEventPidMapping[event_id].indexOf(senderPid);
            if (i > -1) {
                delete remoteEventPidMapping[event_id][i];
                remoteEventPidMapping[event_id].splice(i, 1);
            }
        }
    }
    return callback();
}

export function ClearAll() {
    for (var k in remoteEventPidMapping)
        delete remoteEventPidMapping[k];
}
