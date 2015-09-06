require 'wheel'
local inspect = require 'inspect'
local posix = require 'posix'

--
bootstrap(function()
	
	print 'bootstrap in eventloop'
	
	onChildSignal(function(pid, state) 
		print ('child', pid, inspect(state))	
	end)
	
	local stdout1 = io.popen('node test')
	local stdout2 = io.popen('node test2')
	
	onData(stdout1, function(t)
		print("test:", t)
	end)
	onData(stdout2, function(t)
		print("test2:", t)
	end)
	
	local timer = setInterval(function()
		print '.5sec'
	end, 500)
	
	setTimeout(function()
	end, 5000)
	
	
end)

