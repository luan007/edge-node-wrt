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

package.path = package.path .. ";../Tools/?.lua;./?.lua"

local cjson = require "cjson"
local utils = require "utils"

local function dump_station(ap_no)
    local stations = {}
    local ln = "\n"
    local mac = nil

    local output = utils.exec("iw ap"..ap_no.." station dump")
    local rows = utils.split(output, ln)

    for _, v in iparis(rows) do
        if (utils.startswith(v, "Station")) then -- new RECORD
            mac = utils.split(v, " ")[2]
            stations[mac] = {}
        else
            local parts = v.split(":")
            local k = utils.trimall(parts[1], "%s*")
            local v = utils.trimall(parts[2], "%s*")
            stations[mac][k] = v
        end
    end

    return stations
end

