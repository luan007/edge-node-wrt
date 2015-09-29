--debug only

DEBUG = 1

package.path = package.path .. ";../RPC/?.lua" .. ";../?.lua"
require 'sh'
require 'permission'
local ffi = require('ffi')
local uv = require('luv')
local apisocket = require('apisocket')
local dbg = require('dbg')('api.server')
local functions = require("functions")
local events = require("events")

local server
local sockpath = '/tmp/crap'

local SOL_SOCKET = 1
local SO_PEERCRED = 17

ffi.cdef [[
    typedef struct unixcred { int pid, uid, gid; } unixcred_t;
    int getsockopt(int sockfd, int level, int optname, void *optval, int *optlen);
]]

local opt = ffi.typeof("unixcred_t")()
local lenT = ffi.typeof("int[1]")()
lenT[1] = 3

local regHandlers = {}

function __APIEntryPoint(func)
    dbg("Register API EntryPoint", #regHandlers)
    regHandlers[#regHandlers + 1] = func
end

local function initialize()
    server = uv.new_pipe(false)
    rm { '-rf', sockpath }
    uv.pipe_bind(server, sockpath)
    uv.listen(server, 128, function(err)
        dbg('New Connection - e:', err)
        assert(not err, err) --server error!!! --everything fucked
        local client = uv.new_tcp()
        uv.accept(server, client)
        local fd = uv.fileno(client)
        dbg("FD = ", fd)
        local result = ffi.C.getsockopt(fd, SOL_SOCKET, SO_PEERCRED, opt, lenT)
        if ((not DEBUG) and result < 1) then
            dbg("*Error* GetSockOpt failed!")
            --something is seriously wrong..
        else
            dbg('PID=', opt.pid)
            for i = 1, #regHandlers do
                dbg('Calling socket handler #', i)
                local serve,
                remoteid,
                permission,
                onerr,
                onclose = regHandlers[i](opt)
                if (serve) then
                    events.AddToHub(remoteid, client)
                    dbg('Serve! #', i)
                    PermissionOps.Set(remoteid, permission)
                    onerr = onerr and onerr or function() end
                    onclose = onclose and onclose or function() end
                    apisocket.handle(client,
                        function(...) --onerror
                        pcall(function() enduv.close(client) end)
                        events.RemoveFromHub(remoteid)
                        onerr(...)
                        end,
                        function() --onclose
                        pcall(function() enduv.close(client) end)
                        events.RemoveFromHub(remoteid)
                        onclose()
                        end,
                        function(...)
                            return functions.oncall(remoteid, ...)
                        end)
                    return
                end
            end
        end
        dbg('socket slipped away, closing')
        uv.close(client)
    end)
end


__EVENT("Event.Demo")

__API(function(remote, cb)
    __EMIT("Event.Demo", "data1", { key = "data2", val = { "someotherthing" } })
    return true
end, "Trigger")

__APIEntryPoint(function(opt)
    dbg('Dummy Entry Point')
    dbg('opt.pid = ', opt.pid)

    function onerr(...)
        dbg("TestApplication has encountered error")
        dbg(...)
    end

    function onclose()
        dbg("TestApp closing")
    end

    return true, "TestApplication", {
        Permission.Event
    }, onerr, onclose
end)









initialize()
--test only
uv.run()
uv.walk(uv.close)
uv.run()
uv.loop_close()

--[[
create_server(function(client)
    p("new client", client)
    apisocket.handle(client, function(...) --onevent
    print("server: error", ...)
    end, function() --onclose
    print("server: socket closed")
    end, function(funcId, params, cb, socket) --oncall
    apisocket.Emit(client, funcId, { "hehe", { test = {1,2,3,4,5} } })
    return { params[1], funcId, "helloworld", nil, { nil, 1 } }
    end)
end)



function _api_server_on_new_socket(socket: net.Socket) {
    //Get Unix Socket UID/PID
socket.pause();
socket.on("error", (err) => {
    error(err);
    socket.destroy();
    process.nextTick(() => {
    socket.removeAllListeners();
});
});
socket.on("end", (err) => {
    process.nextTick(() => {
    socket.removeAllListeners();
});
});
uscred.getCredentials(socket, (err, res) => {
    debug("New Socket Inbound, Entering loop - PID " + res.pid);
if (err) {
    //error(err); //FAILED
return socket.destroy();
}
for (var i = 0; i < _proc.length; i++) {
if (_proc[i](socket, res)) {
    debug("Socket Accepted by Proc handler #" + i);
return;
}
}
debug("No one wants this socket, disconnect PID=" + res.pid);
socket.destroy();
});
}

export function AddHandler(connection_Processor) {
    debug(("#" + _proc.length) + " Pushing Handler into API Server Stack");
    _proc.push(connection_Processor);
}

export function Serve(socket: net.Socket | any, remoteType, remoteId, event_enabled, cb) {
    socket.removeAllListeners("error");
    socket.on("error", (err) => {
if (event_enabled) {
    debug("Removing from Hub " + remoteId);
    evhub.RemoveFromEventHub(socket);
    socket = undefined;
}
error(("Socket Disconnected [" + remoteType + ":" + remoteId + "]"));
//error(err);
}).on("end", () => {
if (event_enabled) {
    debug("Removing from Hub " + remoteId);
    evhub.RemoveFromEventHub(socket);
    socket = undefined;
}
debug(("Socket Safely Disconnected [" + remoteType + ":" + remoteId + "]"));
});
apisock.hookSocket(socket);
socket.type = remoteType;
socket.remote = remoteId;
if (event_enabled) {
    evhub.AddToEventHub(socket);
}
debug("Resuming Socket");
socket.resume();
return socket;
}

export function Initialize(_port) {


    // global.SenderType = SenderType;
// global.SenderId = SenderId;
_api_server.listen(_port, () => {
    fs.chmodSync(_port, 511);
});

apisock.initHandlers(funcs.oncall, () => {
});

debug("API Server Listening on " + _port);
}
--]]