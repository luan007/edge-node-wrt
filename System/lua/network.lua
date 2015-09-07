require "wheel"
local posix = require "posix"
local inspect = require "inspect"
local process = require "process"
local cjson = require "cjson"

local ppp_secrets = "/etc/ppp/pap-secrets"
local chap_secrets = "/etc/ppp/chap-secrets"

local cmd = "dnsmasq"
local dnsmasq_conf = "/etc/dnsmasq.conf"
local status_conf = "/etc/dnsmasq.status.json"

local sighup_conf = "/etc/dnsmasq.sighup.conf"

local addn_hosts = "/etc/dnsmasq.dhcp.hostsfile.conf"
local dhcp_hosts = "/etc/dnsmasq.addn.hosts.conf"
local servers_file = "/etc/dnsmasq.server.file.conf"

function read_file(path)
    local f = io.open(path, "rb")
    local c = f:read("*a")
    f:close()
    return c
end

function write_file(path, content)
    local f = io.open(path, "w+")
    f:write(content)
    f:close()
end

function mini_conf(network_address, dhcp_start, dhcp_end, domain)
    return
    "dhcp-option=6,"..network_address.."\n"..
            "dhcp-range="..dhcp_start..","..dhcp_end.."\n"..
            "listen-address="..network_address..",127.0.0.1\n"..
            "expand-hosts\n"..
            "stop-dns-rebind\n"..
            "dhcp-sequential-ip\n"..
            "domain="..(domain or "edge").."\n"..
            "cache-size=4096\n"..
            "server=8.8.8.8\n"..
            "server=4.4.4.4\n"..
            "address=/.wi.fi/"..network_address.."\n"..
            "address=/.wifi.network/"..network_address.."\n"..
            "address=/.ed.ge/"..network_address.."\n"..
            "address=/.wifi/"..network_address.."\n"..
            "addn-hosts=/etc/dnsmasq.dhcp.hostsfile.conf\n"..
            "dhcp-hostsfile=/etc/dnsmasq.addn.hosts.conf\n"..
            "servers-file=/etc/dnsmasq.server.file.conf\n"
end

function start_pppd(account, pwd, number)
    local secrets = '"'..account..'"\t*\t"'..pwd..'"'
    write_file(ppp_secrets, secrets)
    write_file(chap_secrets, secrets)
    local pppd = process.new()
    pppd.start("pppd", "plugin", "/usr/lib/pppd/2.4.7/rp-pppoe.so", "name", account, "unit", number, "noipdefault", "defaultroute", "mtu", "1492", "mru", "1492", "lock", "ipv6", "usepeerdns", "nodetach")
    return pppd
end

function start_udhcpc(interface)
    local udhcpc = process.new()
    udhcpc.start("udhcpc", "-i", interface, "-f")
    return udhcpc
end

bootstrap(function()
    local daemon = process.new()

    onStatChange(status_conf, function(p, t)
        local config = cjson.decode(read_file(status_conf))
        if config.wan and config.wan.scheme and config.wan.scheme == "udhcpc" then
            start_udhcpc("eth2")
        else
            start_pppd(config.wan.ppp.account, config.wan.ppp.passwd, config.wan.ppp.number)
        end
        local content = mini_conf(config.network_address
            , config.dhcp_start
            , config.dhcp_end
            , config.domain)
        print(content)
        write_file(dnsmasq_conf, content)
        daemon:start(cmd, "-C", dnsmasq_conf, "-k")
    end)

    onStatChange(dnsmasq_conf, function(p, t)
        print(inspect(t))
    end)
end)
