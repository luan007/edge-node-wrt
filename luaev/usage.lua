require 'wheel'
local inspect = require 'inspect'
local posix = require 'posix'
local daemon = require 'process'

bootstrap(function()
	-- 
	-- onChildSignal(function(pid, state) 
	-- 	print ('child', pid, inspect(state))	
	-- end)
	-- 
	--local node = spawn('node')
	--print(node.pid)
	
	daemon.start('demo', 'node')
	daemon.start('demo2', 'node', 'demo.js')
	
	setTimeout(function() 
		daemon.kill('demo', posix.SIGHUP)
	end, 1500)
	-- setTimeout(function() 
	-- 	print('kill node #', node.pid)
	-- 	posix.kill(node.pid)	
	-- end, 3000)
	
	-- local timer = setInterval(function()
	-- 	print('0.5 s')
	-- end, 500)
	-- 
	-- setTimeout(function()
	-- 	local process = spawn('ping', '127.0.0.1')
	-- 	print(process.pid)
	-- 	onData(process.stdout, function(t)
	-- 		print('ping', t)
	-- 	end)
	-- end, 5000)
	
end)

