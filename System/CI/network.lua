package.path = package.path .. ";../Scripts/Tools/?.lua;./?.lua"

local inspect = require "inspect"
local utils = require "utils"
local conflib = require "conflib"

local path = "/etc/dnsmasq.conf"

network = {}

function network.translate()
    local rows, headers = conflib.read_config(path)
    local json = conflib.read_json(conflib.sections.__NETWORK)
    local up_interface = json.wan.up_interface

    for key, source in pairs(json) do
        if (key == "lan") then
            rows["dhcp-option"] = {}
            table.insert(rows["dhcp-option"], "46,8")
            table.insert(rows["dhcp-option"], "6," .. source.routerip)
            rows["listen-address"] = source.routerip .. ",127.0.0.1"
            rows["address"] = {}
            table.insert(rows["dhcp-option"], "/.wi.fi/" .. source.routerip)
            table.insert(rows["dhcp-option"], "/.wifi.network/" .. source.routerip)
            table.insert(rows["dhcp-option"], "/.ed.ge/" .. source.routerip)
            table.insert(rows["dhcp-option"], "/.wifi/" .. source.routerip)
            -- set br0 ip
            utils.exec("ifconfig br0 " .. source.routerip)
            -- netmask
            local networkAddress = source.routerip .. "/" .. source.netmask
            utils.exec("iptables -w -t nat -R nginx_proxy 1 -d " .. networkAddress, " -j RETURN");
            utils.exec("iptables -w -t filter -R FORWARD 1 -c 0 0 -s " .. networkAddress .. " -o " .. up_interface .. " -j internet_up_traffic")
            utils.exec("iptables -w -t filter -R FORWARD 2 -c 0 0 -d " .. networkAddress .. " -i " .. up_interface .. " -j internet_down_traffic")
            utils.exec("iptables -w -t filter -R FORWARD 3 -c 0 0 -s " .. networkAddress .. " -d " .. networkAddress .. " -j intranet_up_traffic")
            utils.exec("iptables -w -t filter -R FORWARD 4 -c 0 0 -s " .. networkAddress .. " -d " .. networkAddress .. " -j intranet_down_traffic")
        elseif (key == "dhcp_range") then
            rows["dhcp-range"] = source.start .. "," .. source["end"]
        elseif (key == "wan" and source.scheme == "ppp") then
            local secrets = source.ppp.account .. "\t*\t" .. source.ppp.passwd .. "\n"
            io.open("/etc/ppp/pap-secrets", "w+"):write(secrets)
            io.open("/etc/chap-secrets", "w+"):write(secrets)
            utils.exec("iptables -w -t nat -R routing_masquerade 1 -j MASQUERADE -o " .. soource.up_interface)
        elseif (key == "domain") then
            rows["domain"] = source
        elseif (key == "dns") then
            local buf = ""
            local fname = "/ramdisk/System/Configs/dnsmasq_server_file.conf"
            for _, ip in ipairs(source) do
                buf = buf .. "server=" .. ip .. "\n"
            end
            buf = utils.trimend(buf, "\n")
            if (not utils.md5compare(fname, buf)) then
                io.open(fname, "w+"):write(buf)
                --TODO: send SIGHUP
            end
        end
    end

    if (conflib.write_config(path, rows, headers)) then
        --TODO: send RESTART
    end
end

return network
