require "wheel"
local posix = require "posix"
local inspect = require "inspect"
local process = require "process"
local cjson = require "cjson"

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

bootstrap(function()
    local daemon = process.new()

    onStatChange(status_conf, function(p, t)
        local status = cjson.decode(read_file(status_conf))
        local content = mini_conf(status.network_address
            , status.dhcp_start
            , status.dhcp_end
            , status.domain)
        print(content)
        write_file(dnsmasq_conf, content)
        daemon:start(cmd, "-C", dnsmasq_conf, "-k")
    end)

    onStatChange(dnsmasq_conf, function(p, t)
        print(inspect(t))
    end)
end)
