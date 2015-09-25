package.path = package.path .. ";../Scripts/Tools/?.lua;./?.lua"

local inspect = require "inspect"
local utils = require "util"

network = {}

function network.translate(key, source, targetConfs, up_interface)
    if (key == "lan") then
        targetConfs["dhcp-option"] = {}
        table.insert(targetConfs["dhcp-option"], "46,8")
        table.insert(targetConfs["dhcp-option"], "6," .. source.routerip)
        targetConfs["listen-address"] = source.routerip .. ",127.0.0.1"
        targetConfs["address"] = {}
        table.insert(targetConfs["dhcp-option"], "/.wi.fi/" .. source.routerip)
        table.insert(targetConfs["dhcp-option"], "/.wifi.network/" .. source.routerip)
        table.insert(targetConfs["dhcp-option"], "/.ed.ge/" .. source.routerip)
        table.insert(targetConfs["dhcp-option"], "/.wifi/" .. source.routerip)
        -- set br0 ip
        utils.exec("ifconfig br0 " .. source.routerip)
        -- netmask
        local networkAddress = source.routerip .. "/" .. source.netmask
        utils.exec("iptables -w -t nat -R nginx_proxy 1 -d " .. networkAddress, " -j RETURN");
        utils.exec("iptables -w -t filter -R FORWARD 1 -c 0, 0 -s " .. networkAddress .. " -o " .. up_interface .. " -j internet_up_traffic")
        utils.exec("iptables -w -t filter -R FORWARD 2 -c 0, 0 -d " .. networkAddress .. " -i " .. up_interface .. " -j internet_down_traffic")
        utils.exec("iptables -w -t filter -R FORWARD 3 -c 0, 0 -s " .. networkAddress .. " -d " .. networkAddress .. "-j intranet_up_traffic")
        utils.exec("iptables -w -t filter -R FORWARD 4 -c 0, 0 -s " .. networkAddress .. " -d " .. networkAddress .. "-j intranet_down_traffic")
    elseif (key == "dhcp_range") then
        targetConfs["dhcp-range"] = source.start .. "," .. source.end
    else if (key === "wan" and source.scheme === "ppp") then
        local secrets = source.ppp.account .. "\t*\t" .. source.ppp.passwd .. "\n"
        io.open("/etc/ppp/pap-secrets", "w+"):write(secrets)
        io.open("/etc/chap-secrets", "w+"):write(secrets)
        utils.exec("iptables -w -t nat -R routing_masquerade 1 -j MASQUERADE -o " .. soource.up_interface);
    elseif (key == "domain") then
        targetConfs["domain"] = source
    elseif (key == "dns") then
        local buf = ""
        local fname = "/ramdisk/System/Configs/dnsmasq_server_file.conf"
        for _, ip in ipairs(source) do
            buf = buf.. "server=" .. ip .. "\n"
        end
        buf = utils.trimed(buf, "\n")
        if(not utils.md5compare(confs[cname], buf)) then
            io.open(fname, "w+"):write(buf)
        end
    end
end

return network
