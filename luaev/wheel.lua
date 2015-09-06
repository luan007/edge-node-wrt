--[[

    libwheel
    
    a heavily nodejs flavored libev wrapper :p
    should be light enough for u though
    
    
    Mike Luan 2015

--]]

local ev = require 'ev'
local posix = require "posix"
local signal = require "posix.signal"
local LOOP = ev.Loop.default
local debug = require('dbg')('libwheel')
local time = os.time()

-- 
-- local file = io.popen('node test.js')
-- print(type(file))
-- local fd = posix.fileno(file)
-- print(type(fd))
-- 

local registry = {}
local pidmap = {}

millis = function()
    return (os.time() - time)
end 

ostime = function()
    return os.time()
end 

function _once(fn, arr, id)
    return function(loop, now, rev)
        now:stop(loop)
        if arr and id then 
            arr[id] = nil
        end 
        fn()
    end
end

function _timer_closure(fn, timerId)
    return function()
        return fn(timerId)
    end
end

--[[
    stop/remove specified event/timer
    @o     : handle
    
    return  : 1 (OK) | -1 (FAIL)
]]--
function _clear(o)
    if registry[o] then
        debug('clear', 'event', o)
        registry[o]:stop(registry[o]._loop)
        registry[o] = nil
        return 1
    else
        debug('clear', 'event not found', o)
        return -1
    end 
end

removeListener  = _clear 
clearWatcher    = _clear 
clearHandle     = _clear 
clearStat       = _clear
clearTimeout    = _clear
clearInterval   = _clear


spawn = function(program, ...)
    local read, write = posix.pipe()
    local cpid = posix.fork()
    if cpid == 0 then --inside child process
        debug('[CLIENT] forked lua for', program, ...)
		assert(0 == posix.dup2(read,0)) --redirect everything
		assert(1 == posix.dup2(write,1)) --redirect this too
        posix.execp(program, ...) --replace my exec target
    else 
        debug('[MASTER] forked pid=' .. cpid)
        pidmap[cpid] = 1
        return {stdout=read, stdin=write, pid=cpid}
    end
end

--[[
    defer call onto next event-loop (idle)
    @fn     : callback => function()
    @loop   : ev loop object, optional
]]--
nextTick = function(fn, loop)
    if not loop then loop = LOOP end
    ev.Idle.new(_once(fn)):start(loop)
end

--[[
    works like js's setTimeout, uses ev.Timer
    @fn     : callback => function(timer_handle)
    @t      : time in milliseconds
    @loop   : ev loop object, optional
    
    return  : timer handle (number)
]]--
setTimeout = function(fn, t, loop)
    if not loop then loop = LOOP end
    local t = t / 1000
    fn = _timer_closure(fn, #registry + 1)
    registry[#registry + 1] = ev.Timer.new(_once(fn, _timeouts, #registry + 1), t)
    registry[#registry]._loop = loop
    registry[#registry]:start(loop)
    return #registry
end

--[[
    works like js's setInterval, uses ev.Timer
    @fn     : callback => function(timer_handle)
    @t      : time in milliseconds
    @loop   : ev loop object, optional
    
    return  : timer handle (number)
]]--
setInterval = function(fn, t, loop)
    if not loop then loop = LOOP end
    local t = t / 1000
    fn = _timer_closure(fn, #registry + 1)
    registry[#registry + 1] = ev.Timer.new(fn, t, t)
    registry[#registry]._loop = loop
    registry[#registry]:start(loop)
    return #registry
end

--[[
    terminate ev-driven lua process
]]--
terminate = function()
    --not enough, let us kill everything..
    for k,v in next,pidmap do
        debug('killing running child', k)
        posix.kill(k)
    end
    debug('terminating')
    LOOP:unloop() 
    os.exit()
end

--[[
    bootstrap ev-driven lua process, where fn should be viewed as your main function, 
    and bootstrap should be the first line of your code (besides require)
    @fn     : callback function() - called when the event loop is ready
]]--
bootstrap = function(fn)
    debug('register sigterm_sigint')
        stat = ev.Signal.new(sigint_or_term, signal.SIGTERM)
        stat:start(LOOP)
        stat = ev.Signal.new(sigint_or_term, signal.SIGINT)
        stat:start(LOOP)
    debug('register bootstrap function')
        if fn then 
            nextTick(fn)
        end
    debug('register spawn cleanup function')
        
        onChildSignal(function(pid, state) 
            if state.exited == true then
                pidmap[pid] = nil
            end
        end)

    debug('main loop')
        LOOP:loop()
        --SHOULD STOP HERE :)
        terminate()
end 

function sigint_or_term()
	terminate()
end

--[[
    registers event for file stat change
    @path   : file / directory path
    @fn     : callback => function(path, filestat)
    @once   : true if you want this to be triggered only once, optional
    @loop   : ev loop object, optional
    
    return  : event handle (number)
]]--
onStatChange = function(path, fn, once, loop)
    if not loop then loop = LOOP end
    local _id = #registry + 1;
    registry[_id] = ev.Stat.new(
        once == nil and 
            function(loop, stat, ev)
                fn(path, stat:getdata())
            end 
        or 
            function(loop, stat, ev)
                stat:stop(loop)
                registry[_id] = nil
                fn(path, stat:getdata())
            end 
        , path)
    registry[_id]._loop = loop
    registry[_id]:start(loop)
    return _id
end


--[[
    registers event for process-level signals
    @signal : posix.signal.SIGTERM or so on.. The signal you may want to listen
    @fn     : callback => function(signal)
    @once   : true if you want this to be triggered only once, optional
    @loop   : ev loop object, optional
    
    return  : event handle (number)
]]--
onSignal = function(signal, fn, once, loop)
    if not loop then loop = LOOP end
    local _id = #registry + 1;
    registry[_id] = ev.Signal.new(
        once == nil and 
            function(loop, sig)
                fn(signal)
            end 
        or 
            function(loop, sig)
                stat:stop(loop)
                registry[_id] = nil
                fn(signal)
            end 
        , path)
    registry[_id]:priority(ev.MAXPRI) -- this ensures your event triggers first
    registry[_id]._loop = loop
    registry[_id]:start(loop)
    return _id
end

--[[
    registers event for childprocess signals
    @fn     : callback => function(childpid, childstatus[table])
    @pid    : 0 if you want all child processes, any number(pid) for listening specific pids, optional    
    @once   : true if you want this to be triggered only once, optional
    @loop   : ev loop object, optional
    
    return  : event handle (number)
]]--
onChildSignal = function(fn, pid, once, loop)
    if not loop then loop = LOOP end
    local _id = #registry + 1;
    registry[_id] = ev.Child.new(
        once == nil and 
            function(loop, child)
                fn(child:getrpid(), child:getstatus())
            end 
        or 
            function(loop, child)
                child:stop(loop)
                registry[_id] = nil
                fn(child:getrpid(), child:getstatus())
            end 
        , pid ~= nil and pid or 0, true)
    registry[_id]._loop = loop
    registry[_id]:start(loop)
    return _id
end

onIO = function(fileid, flag, fn, once, loop)
    if not loop then loop = LOOP end
    local _id = #registry + 1;
    local fd = fileid
    if type(fileid) == 'userdata' then
        fd = posix.fileno(fileid)
    end
    --r = 0x02
    --w = 0x04
    --rw= 0x06
    
    local evflag = ev.READ
    
    if flag == 'r' then 
        evflag = ev.READ
    elseif flag == 'w' then 
        evflag = ev.WRITE
    elseif flag == 'rw' then
        evflag = 0x04 
    end
    
    registry[_id] = ev.IO.new(
        once == nil and 
            function(loop, io, ev)
                fn(ev, fileid, fd, io)
            end 
        or 
            function(loop, io, ev)
                io:stop(loop)
                registry[_id] = nil
                fn(ev, fileid, fd, io)
            end 
        , fd, evflag)
    registry[_id]._loop = loop
    registry[_id]:start(loop)
    return _id
end

onReadable = function(fileid, fn, once, loop)
    return onIO(fileid, 'r', fn, once, loop)
end

onWriteable = function(fileid, fn, once, loop)
    return onIO(fileid, 'w', fn, once, loop)
end

onData = function(fileid, fn, once, loop)
    --handled version of onReadable
    local fileold = fileid
    if type(fileid) == 'userdata' then
        fileid = posix.fileno(fileid)
    end
    
    local fdmock = {
        [fileid] = { events = { IN = true } }
    }
    
    d = onReadable(fileid, function()
        debug(fileid, 'readable')
        while fdmock and posix.poll(fdmock, 0) == 1 do 
            --this is bad, we should move fdmock outside the function, for better concurrent throughtput
			for fd in pairs(fdmock) do
				if fdmock[fd].revents.IN then
					local t = posix.read(fd, 1024)
					fn(t, fileold, fileid)
				end
				if fdmock[fd].revents.HUP then
					posix.close(fd)
					fdmock[fd] = nil
                    fdmock = nil
                    clearHandle(d)
					if not (fdmock and next(fdmock)) then return end
				end
			end
		end
    end, once, loop)
    return d
end

