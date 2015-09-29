package.path = package.path .. ";/ramdisk/System/Scripts/Tools/?.lua;/ramdisk/System/CI/?.lua"

local inspect = require "inspect"
local utils = require "utils"

local __HOSTAPD2G = "/etc/hostapd_2g.conf"
local __HOSTAPD5G = "/etc/hostapd_5g.conf"

wifi = {}

function wifi.translate()
    local rows_2g, headers_2g = conflib.read_config(__HOSTAPD2G)
    local rows_5g, headers_5g = conflib.read_config(__HOSTAPD5G)
    local json = rows.read_json(conflib.sections.__WIFI)

    for key, source in pairs(json) do
        if (key == "wlan2g") then
            if(source["ssid"]) then
                rows2g["ssid"] = source["ssid"]
            end
        elseif (key == "wlan5g") then
            if(source["ssid"]) then
                rows_5g["ssid"] = source["ssid"]
            end
        end
    end

    if (conflib.write_config(__HOSTAPD2G, rows_2g, headers_2g)) then
        utils.exec("/usr/sbin/wifid 2g restart")
    end

    if (conflib.write_config(__HOSTAPD5G, rows_5g, headers_5g)) then
        utils.exec("/usr/sbin/wifid 5g restart")
    end
end

return wifi
