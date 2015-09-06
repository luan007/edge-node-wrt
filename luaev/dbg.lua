--[[
	
	yet another debug lib
	tributes to TJ

	Mike Luan 2015

]]--

d = os.getenv('DEBUG') and '^'..os.getenv('DEBUG')..'$' or nil -- regex, obviously
t = os.time()

local function emptyfunc()
	--nothing
end

local function logger_factory(name)
	if(d == nil or d == '' or string.find(name, d) ~= 1 or string.match(name, d) == '') then
		return emptyfunc
	else 
		return function(...)
			   		print(os.date("%H:%M:%S", os.time() - t) .. ' [' .. name .. ']',  ...)
			   end
	end
end

return function(name)
	return logger_factory(name)
end