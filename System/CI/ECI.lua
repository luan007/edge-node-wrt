--
-- ECI
--
--      Invocation:
--              lua ECI network set
--              lua ECI network get key
--
package.path = package.path .. ";../Scripts/Tools/?.lua"

local inspect = require "inspect"
local dbg = require "dbg"
local utils = require "utils"

if #arg < 2 then
    return print("usage: lua ECI xxx get/set")
end

local entry = arg[1]
local command = arg[2]

local __DNSMASQ = "dnsmasq"
local __HOSTAPD2G = "hostapd2g"
local __HOSTAPD5G = "hostapd5g"
local __HOSTS = "hosts"
local confs = {}
confs[__DNSMASQ] = "/etc/dnsmasq.conf"
confs[__HOSTAPD2G] = "/etc/hostapd_2g.conf"
confs[__HOSTAPD5G] = "/etc/hostapd_5g.conf"
confs[__HOSTS] = "/ramdisk/System/Configs/dnsmasq_addn_hosts.conf"

local __NETWORK = "network"
local __WIFI = "wifi"
local __FIREWALL = "firewall"
local __SYSTEM = "system"
local __TIME = "time"
local __SSH = "ssh"
local entries = {}
entries[__NETWORK] = "/etc/network.json"
entries[__WIFI] = "/etc/wifi.json"
entries[__FIREWALL] = "/etc/firewall.json"
entries[__SYSTEM] = "/etc/system.json"
entries[__TIME] = "/etc/time.json"
entries[__SSH] = "/etc/ssh.json"
entries[__HOSTS] = "/etc/hosts.json"

local targetConfs = {}
local sortedkeys = {}
local function readConfig(cname)
    targetConfs[cname] = targetConfs[cname] or {}
    sortedkeys[cname] = sortedkeys[cname] or {}
    local conf = confs[cname]
    local delimiter = "="
    local ln = "\n"
    local f = io.open(conf)

    for line in f:lines() do
        local parts = utils.split(line, delimiter)
        local row = parts[1]
        local val = parts[2]
        -- for sorting
        if not utils.contains(sortedkeys[cname], row) then
            table.insert(sortedkeys[cname], row)
        end
        if(targetConfs[cname][row]) then
            local old = targetConfs[cname][row]
            targetConfs[cname][row] = {}
            if(type(old) == "table") then
                targetConfs[cname][row] = utils.concat(targetConfs[cname][row], old);
            elseif(type(old) == "string") then
                targetConfs[cname][row] = utils.append(targetConfs[cname][row], old)
            end
            targetConfs[cname][row] = utils.append(targetConfs[cname][row], val and val or val)
        else
            targetConfs[cname][row] = val
        end
    end
end

local sourceConfs = {}
local function readEntry(ename)
    local path = entries[ename];
    sourceConfs[ename] = utils.parse(io.open(path):read("*a"));
end

local function writeConf(cname)
    local buf = ""
    for i, row in ipairs(sortedkeys[cname]) do
        local o = targetConfs[cname][row]
        if(type(o) == "table") then
            for k, v in pairs(o) do
                buf = buf..row.."="..o[k].."\n";
            end
        elseif(type(o) == "string") then
            buf = buf..(string.len(o) > 0 and row.."="..o or row) .. "\n";
        elseif(o == nil) then
            buf = buf..row.."\n"
        end
    end

    buf = utils.trimend(buf, "\n")

    if(not utils.md5compare(confs[cname], buf)) then
        io.open(confs[cname], "w+"):write(buf)
    end
end

readConfig(__DNSMASQ)

writeConf(__DNSMASQ)
