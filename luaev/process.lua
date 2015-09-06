scope = {}

require "wheel"
local inspect = require "inspect"
local posix = require "posix"
local args = nil
local thread = nil

function cleanup()
    posix.kill(thread.pid, 9)
    thread = nil
end

function daemonize()
    local e = onChildSignal(function(pid, state)
        print("state:", inspect(state))
        if state.exited == true then
            print("dead, restarting...")
            if thread ~= nil then cleanup() end
            removeListener(e)
            scope.start(unpack(args))
        end
    end, thread.pid)
end

function scope.start(...)
    if thread == nil then
        args = {...}
        print(inspect(args))
        thread = spawn(unpack(args))
        daemonize()
    end
end

function scope.kill()
    if thread ~= nil then
        cleanup()
    end
end

scope.conf = conf
return scope

