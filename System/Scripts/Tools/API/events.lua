package.path = package.path .. ";../RPC/?.lua" .. ";../?.lua"
require 'permission'
local dbg = require('dbg')('api.events')
local apisocket = require('apisocket')

local exports = {
    paths = {},
    events = {},
    eventClients = {},
    eventRegs = {},
    eventPerms = {},
    flags = {} --tbd
}


function exports.AddToHub(id, client)
    if not (client and id) then return nil end
    exports.eventClients[id] = client
    exports.eventRegs[id] = {}
end

function exports.RemoveFromHub(id)
    if not (id and exports.eventClients[id]) then return nil end
    exports.eventClients[id] = nil
    exports.eventRegs[id] = nil
end


function __EVENT(path, permission, flags)
    local id = #exports.events + 1
    exports.paths[path] = id
    exports.events[id] = path
    exports.eventPerms[id] = PermissionOps.Encode(permission)
    exports.flags[id] = flags
    dbg("Event" .. " #" .. id .. " " .. path)
end

function __EMIT(path, ...)
    local id = exports.paths[path]
    if (not id) then return error("Event not found " .. path) end
    for i,v in pairs(exports.eventClients) do
        if (exports.eventRegs[i][id]) then
            local client = exports.eventClients[i]
            apisocket.Emit(client, id, {...})
            dbg("Emit" .. " #" .. id .. " " .. path .. ' > ' .. i)
        end
    end

end

function DumpEvents()
    return exports.paths
end

local function Remote_AddListener(context, event_list)
    local remote = context.id
    if not (event_list and remote and exports.eventClients[remote]) then return error('Rejected due to illegal remote Id') end
    local lst = type(event_list) == "table" and event_list or { event_list }
    local results = {}
    for i = 1, #lst do
        results[#results + 1] = true
        if (exports.paths[lst[i]]) then
            local id = exports.paths[lst[i]]
            if (PermissionOps.Check(PermissionOps.Get(remote), exports.eventPerms[id])) then
                exports.eventRegs[remote][id] = true
            else
                results[#results] = "error: Permission Denied {" .. lst[i] .. "}"
            end
        else
            results[#results] = "error: Event not found {" .. lst[i] .. "}"
        end
    end
    if (type(event_list) ~= "table") then
        return results[1]
    end
    return results
end

__API(Remote_AddListener, "RegisterEvent", { Permission.Event });


return exports

--
--import api = require('../RPC/apisocket');
--import pm = require("./Permission");
--
--export var Events = [];
--var _evperms = [];
--
--var _sockets = {}; //SENDER_KEY <-> SOCKET
--var _remote_event_registry = {}; // SENDER_KEY <-> EVENT_PATH
--
--export function AddToEventHub(socket) {
--if (!socket || !socket.remote) return;
--_sockets[socket.remote] = socket;
--_remote_event_registry[socket.remote] = {};
--}
--
--export function RemoveFromEventHub(socket) {
--    _remote_event_registry[socket.remote] =
--_sockets[socket.remote] = undefined;
--}
--
--function __EVENT(path:string,
--permission?:Permission[]) {
--    debug("EVENT " + path);
--    Events.push(path);
--    _evperms.push(pm.Encode(permission));
--}
--
--function __EMIT(path:string,
--...data) {
--    var id = Events.indexOf(path);
--if(!id) throw new Error("Event " + path + " not found or not registered yet!");
--debug("Emit event: " + path);
--//Actually Emit this event
--for (var dest in _remote_event_registry) {
--if (_sockets[dest] && _remote_event_registry[dest][id] == 1) {
--    api.Emit(_sockets[dest], id, data);
--}
--}
--}
--
--function Remote_AddListener(event_list, callback) {
--    var id = this.sender;
--var owned = pm.GetPermission(id);
--
--if (!id || !_sockets[id]) {
--return callback(new Error("Permission Denied"));
--}
--if (!event_list) {
--return callback(new EvalError("Faulty Params"));
--}
--if (Array.isArray(event_list)) {
--    //a try-best implementation
--var errs = [];
--var suc = [];
--for (var i = 0; i < event_list.length; i++) {
--    var eid = Events.indexOf(event_list[i]);
--if (!eid) {
--    suc.push(0);
--    errs.push(new Error("Event not found"));
--continue;
--}
--//var owned = _handled_rpc_table[id].Perm;
--if (!pm.Check(owned, _evperms[eid])) {
--    suc.push(0);
--    errs.push(new Error("Permission Denied - " + event_list[i]));
--continue;
--}
--suc.push(1);
--_remote_event_registry[id][eid] = 1;
--}
--return callback(errs.length > 0 ? new Error(JSON.stringify(errs)) : undefined, suc);
--}
--else {
--    var eid = Events.indexOf(event_list);
--var perm = _evperms[eid];
--if (!eid) {
--return callback(new Error("Event not found"));
--}
--if (!pm.Check(owned, perm)) {
--return callback(new Error("Permission Denied"));
--}
--_remote_event_registry[id][eid] = 1;
--return callback(undefined, 1);
--}
--}
--
--__API(Remote_AddListener, "RegisterEvent", [Permission.Event]);
--global['__EVENT'] = __EVENT;
--global['__EMIT'] = __EMIT;
