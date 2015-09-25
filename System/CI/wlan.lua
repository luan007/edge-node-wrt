package.path = package.path .. ";../Scripts/Tools/?.lua;./?.lua"

local inspect = require "inspect"
local utils = require "utils"

wlan = {}

function wlan.translate(source, targetConfs)
    if(source["ssid"]) then
        targetConfs["ssid"] = source["ssid"]
    end
end

return wlan
