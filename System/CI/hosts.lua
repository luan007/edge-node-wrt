package.path = package.path .. ";../Scripts/Tools/?.lua;./?.lua"

local inspect = require "inspect"
local utils = require "util"

hosts = {}

function hosts.translate(host, ip, targetConfs)
    targetConfs[host] = ip .. " " .. host
end

return hosts
