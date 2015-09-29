--[[
	
	yet another debug lib
	tributes to TJ

	Mike Luan 2015

]] --

local d = os.getenv('DEBUG') and '^' .. os.getenv('DEBUG') .. '$' or nil -- regex, obviously
local t = os.time()


local function emptyfunc()
    --nothing
end

local function logger_factory(name)
    if (d == nil or d == '' or string.find(name, d) ~= 1 or string.match(name, d) == '') then
        return emptyfunc
    else
        return function(...)
            print(os.date("%X", os.time() - t + 60 * 8 * 60) .. ' [' .. name .. ']', ...)
        end
    end
end

return logger_factory