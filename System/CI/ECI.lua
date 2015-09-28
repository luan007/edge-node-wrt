--
-- ECI
--
--      Invocation:
--              lua ECI network set
--              lua ECI network get key
--
package.path = package.path .. ";../Scripts/Tools/?.lua;./?.lua"

local inspect = require "inspect"
local utils = require "utils"
local conflib = require "conflib"

local res = {
    success = false,
    result = ""
}
local output = function(obj)
    print(utils.stringify(obj))
end

if (#arg < 2) then
    return print("usage: lua ECI xxx get/set")
end

local entry = arg[1]
local command = arg[2]

if (not conflib.target[entry]) then
    print(inspect(conflib.sections))
    return print("invalid entry: ", entry)
end

--local __DNSMASQ = "dnsmasq"
--local __HOSTAPD2G = "hostapd2g"
--local __HOSTAPD5G = "hostapd5g"
--local __HOSTS = "hosts"
--local confs = {}
--confs[__DNSMASQ] = "/etc/dnsmasq.conf"
--confs[__HOSTAPD2G] = "/etc/hostapd_2g.conf"
--confs[__HOSTAPD5G] = "/etc/hostapd_5g.conf"
--confs[__HOSTS] = "/ramdisk/System/Configs/dnsmasq_addn_hosts.conf"

if (command == "get") then
    local key = arg[3]
    if (conflib.target[entry]) then
        local conf = conflib.read_json(entry)
        if(conf and conf[key]) then
            res.success = true
            res.result = conf[key]
            return output(res)
        end
    end

    res.result = "key not found";
    return output(res)

elseif (command == "set") then
    local translator = require(entry)
    translator.translate()
end
