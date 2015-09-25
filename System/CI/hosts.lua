package.path = package.path .. ";../Scripts/Tools/?.lua;./?.lua"

local inspect = require "inspect"
local utils = require "utils"

hosts = {}

function hosts.translate(host, ip, targetConfs)
    targetConfs[host] = ip .. " " .. host
end

return hosts
