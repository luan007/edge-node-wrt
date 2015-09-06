daemon = {}

require "wheel"
local inspect = require "inspect"
local posix = require "posix"
local args = nil
local thread = nil
local debug = require('dbg')('process')


map = {
    --[[
     
    ['hostapd']: {
        pid     = 1358
        args    = {...}
        state   = 'exit'
        started = millis()
        stated  = millis()
        intent  = 'daemon'
    }
    
    --]]
} --tiny manager, key, cmd params

--this does not need to be released
--as this thing is a catch-all
onChildSignal(function(pid, state) 
    -- catch all
    
    if state.exited == false then
        return
    end
    
    for k, v in next, map do
        if map[k].pid == pid then
            map[k].state = 'exit'
            map[k].pid = nil
            if(map[k].stdout) then
                posix.close(map[k].stdout) end
            if(map[k].stdin) then 
                posix.close(map[k].stdin) end
            map[k].stdout = nil
            map[k].stdin = nil
            debug('*'.. k .. '* STOPPED', 
                  map[k].pid, 
                  'intented - ' .. map[k].intent)
            collectgarbage('collect')
            return daemon.takeAction(k)
        end 
    end
    
end)

function daemon.takeAction(key)
    if(key == nil or map[key] == nil) then return end
    local p = map[key]
    
    if(map[key].error) then return end
    debug('taking action', key, inspect(map[key]))
    
    if(p.intent == 'run' and map[key].state == 'exit') then
        local ps = spawn(unpack(map[key].args))
        if(ps == nil) then 
            map[key].error = 1
            return debug ('spawn error', key, inspect(map[key]))
        end 
        p.pid = ps.pid
        p.stdout = ps.stdout
        p.stdin = ps.stdin
        p.state = 'run'
        return p.pid
    elseif(p.intent == 'exit' and map[key].state == 'run') then
        daemon.kill(key)
        return p.pid
    end
end

function daemon.setArg(key, ...)
    local obj = map[key]
    
    debug('set arg', '['..key..']', inspect({...}))
    if(not obj or ... == nil) then return end
    map[key].args = {...}
    return 1
end

function daemon.start(key, ...)
    local obj = map[key]
    if (not obj) and (... ~= nil) then 
    map[key] = {
        name = key,
        state = 'exit',
        pid = nil,
        intent = 'run'
    } 
        debug('New process to be created', inspect(map[key]))
    elseif not obj then 
        debug('WARNING - ', key, ' is being ignored because of empty arg @ very begining')
        return -1
    end
    if (... ~= nil) then
        --let's setup this thing..
        daemon.setArg(key, ...)
    end
    daemon.takeAction(key)
end

function daemon.stop(key)
    local obj = map[key]
    if(obj) then map[key].intent = 'exit' end
    daemon.takeAction(key)
end

function daemon.kill(key, signal)
    local obj = map[key]
    if(not obj or not obj.pid) then return end
    signal = signal and signal or 15
    debug('kill using signal ', signal, key, obj.pid)
    posix.kill(obj.pid, signal)
end

daemon.map = map

return daemon