scope = {}

require "wheel"
local inspect = require "inspect"
local posix = require "posix"

local cmd = "dnsmasq"
local conf = "/etc/dnsmasq.conf"
local status = "/etc/dnsmasq.status"
local thread = nil

function daemonize()
	local e = onChildSignal(function(pid, state)
		print("state:", inspect(state))
		if state.exited == true then
			print("dead, restarting...")
			posix.kill(thread.pid, 9)
			thread = nil
			removeListener(e)
			scope.start()
		end
	end, thread.pid)
end

function scope.start()
	if thread == nil then
		thread = spawn(cmd, "-C", conf, "-k")
		daemonize()
	end
end

function scope.kill()
	if thread ~= nil then 
		posix.kill(thread.pid, 9) 
		thread = nil
	end
end

scope.conf = conf
return scope

