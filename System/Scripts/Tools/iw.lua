--
--  iw ap1 station dump
--        Station 12:34:56:78:9a:bc (on wlan0)
--        inactive time:	1450 ms
--        rx bytes:	24668671
--        rx packets:	114373
--        tx bytes:	1606991
--        tx packets:	8557
--        tx retries:	623
--        tx failed:	1425
--        signal:  	-52 dBm
--        signal avg:	-53 dBm
--        tx bitrate:	150.0 MBit/s MCS 7 40MHz short GI
--        authorized:	yes
--        authenticated:	yes
--        preamble:	long
--        WMM/WME:	yes
--        MFP:		no
--        TDLS peer:	no

if #arg < 1 then
    return print("usage: lua iw apN")
end
local ap = arg[1]

package.path = package.path .. ";../Tools/?.lua;./?.lua"

local cjson = require "cjson"
local utils = require "utils"
local inspect = require "inspect"

local function dump_station(ap)
    local stations = {}
    local ln = "\n"
    local mac = nil

    local lines = utils.exec_withlines("iw "..ap.." station dump")
    for v in lines do
        if (utils.startswith(v, "Station")) then -- new RECORD
            mac = utils.split(v, " ")[2]
            stations[mac] = {}
        else
            local parts = utils.split(v, ":")
            local k = utils.trimall(parts[1], "%s*")
            local v = utils.trimall(parts[2], "%s*")
            stations[mac][k] = v
        end
    end

    return stations
end

local stations = dump_station(ap)
print(cjson.encode(stations))

