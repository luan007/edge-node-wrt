module = {}
local daemon = {}

require "wheel"
local inspect = require "inspect"
local posix = require "posix"

function daemon:start(...)
    if self.thread == nil then
        print("start executed.")
        if not self.first then self.first = false end
        self.args = {...}
        self.thread = spawn(unpack(self.args))
        print(inspect(self.args), "pid:", self.thread.pid)
        self:daemonize()
    end
end

function daemon:daemonize()
    print("daemonize executed.")
    local e = onChildSignal(function(pid, state)
        print("state:", inspect(state))
        if state.exited == true or state.signaled == true then
            print("dead, restarting...")
            self:kill()
            removeListener(e)
            self:start(unpack(self.args))
        end
    end, self.thread.pid)
end

function daemon:clean(signal)
    print("clean executed.")
    posix.kill(self.thread.pid, signal or 9)
    if signal ~= 1 then
        self.thread = nil
    end
end

function daemon:kill(signal)
    print("kill singal received: ", signal or 9)
    if self.thread ~= nil then
        self:clean(signal)
    end
end

daemon.restart = daemon.kill

function daemon:running()
    return self.first ~= nil
end

function module.new()
    local instance = {}
    setmetatable(instance, {
        __index = daemon
    })
    return instance
end

return module
