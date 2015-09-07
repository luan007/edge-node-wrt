module = {}
local daemon = {}

require "wheel"
local inspect = require "inspect"
local posix = require "posix"

function daemon:start(...)
    print(...)
    if self.thread == nil then
        self.args = {...}
        print(inspect(self.args))
        self.thread = spawn(unpack(self.args))
        self:daemonize()
    end
end

function daemon:daemonize()
    local e = onChildSignal(function(pid, state)
        print("state:", inspect(state))
        if state.exited == true then
            print("dead, restarting...")
            if self.thread ~= nil then self:cleanup() end
            removeListener(e)
            self:start(unpack(self.args))
        end
    end, self.thread.pid)
end

function daemon:cleanup(signal)
    posix.kill(self.thread.pid, signal or 9)
    self.thread = nil
end

function daemon:kill(signal)
    if self.thread ~= nil then
        self:cleanup(signal)
    end
end

function module.new()
    local instance = {}
    setmetatable(instance, {
        __index = daemon
    })
    return instance
end

return module
