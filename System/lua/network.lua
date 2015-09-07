--[[
	arg[1]: udhcpc | ppp
	arg[2]: eth0 | username
	arg[3]: userpwd
	arg[4]: number
--]]

require "wheel"
local posix = require "posix"
local inspect = require "inspect"
local process = require "process"
local cjson = require "cjson"

local cmd = "dnsmasq"
local dnsmasq_conf = "/etc/dnsmasq.conf"
local status_conf = "/etc/dnsmasq.status.json"
local sighup_conf = "/etc/dnsmasq.sighup.json"

function start_pppd(account, pwd, number)
    local eci = spawn("lua", "eci.lua", "ppp_conf", account, pwd, number)
    posix.wait(eci.pid)
    local pppd = process.new()
    pppd:start("pppd", "plugin", "/usr/lib/pppd/2.4.7/rp-pppoe.so", "name", account, "unit", number, "noipdefault", "defaultroute", "mtu", "1492", "mru", "1492", "lock", "ipv6", "usepeerdns", "nodetach")
    return pppd
end

function start_udhcpc(interface)
    local udhcpc = process.new()
    udhcpc:start("udhcpc", "-i", interface, "-f")
    return udhcpc
end

function wan()
    local wan_daemon = nil
    if arg[1] == "udhcpc" then
        wan_daemon = start_udhcpc(arg[2])
    elseif arg[1] == "ppp" then
        wan_daemon = start_pppd(arg[2], arg[3], arg[4])
    end
    return wan_daemon
end

bootstrap(function()
    local wan_daemon = wan()
    local daemon = process.new()
    daemon:start(cmd, "-C", dnsmasq_conf, "-k")

    onStatChange(status_conf, function(p, t)
        local eci = spawn("lua", "eci.lua", "dnsmasq_status")
        posix.wait(eci.pid)
        daemon:restart() --SIGKILL
    end)

    onStatChange(sighup_conf, function(p, t)
        local eci = spawn("lua", "eci.lua", "dnsmasq_sighup")
        posix.wait(eci.pid)
        daemon:restart(1) --SIGHUP
    end)
end)
