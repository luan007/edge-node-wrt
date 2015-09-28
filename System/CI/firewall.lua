package.path = package.path .. ";../Scripts/Tools/?.lua;./?.lua"

local inspect = require "inspect"
local utils = require "utils"

firewall = {}

function firewall.translate()
    local json = rows.read_json(conflib.sections.__FIREWALL)

    local iptables = "iptables"
    local dev2G = "ap1"
    local dev5G = "ap0"
    local devGuest2G = "guest0"
    local devGuest5G = "guest1"

    for key, source in pairs(json) do
        if (key == "VLAN_Isolation") then
            local dev2GVlanIsolation = source["WLAN2G"] and source["WLAN2G"] == true
            local dev5GVlanIsolation = source["WLAN5G"] and source["WLAN5G"] == true
            local devGuest2GVlanIsolation = source["WLAN2G_Guest"] and source["WLAN2G_Guest"] == true
            local devGuest5GVlanIsolation = source["WLAN5G_Guest"] and source["WLAN5G_Guest"] == true
            local newworkAddress = routerip .. "/" .. netmask

            utils.exec(iptables .. " -w -t filter -R vlan_isolation 1 -s " .. newworkAddress .. " -i " .. dev2G .. " -j " .. (not dev2GVlanIsolation and "RETURN" or "REJECT"))
            utils.exec(iptables .. " -w -t filter -R vlan_isolation 2 -d " .. newworkAddress .. " -i " .. dev2G .. " -j " .. (not dev2GVlanIsolation and "RETURN" or "REJECT"))
            utils.exec(iptables .. " -w -t filter -R vlan_isolation 3 -s " .. newworkAddress .. " -i " .. dev5G .. " -j " .. (not dev5GVlanIsolation and "RETURN" or "REJECT"))
            utils.exec(iptables .. " -w -t filter -R vlan_isolation 4 -d " .. newworkAddress .. " -i " .. dev5G .. " -j " .. (not dev5GVlanIsolation and "RETURN" or "REJECT"))
            utils.exec(iptables .. " -w -t filter -R vlan_isolation 5 -s " .. newworkAddress .. " -i " .. devGuest2G .. " -j " .. (not devGuest2GVlanIsolation and "RETURN" or "REJECT"))
            utils.exec(iptables .. " -w -t filter -R vlan_isolation 6 -d " .. newworkAddress .. " -i " .. devGuest2G .. " -j " .. (not devGuest2GVlanIsolation and "RETURN" or "REJECT"))
            utils.exec(iptables .. " -w -t filter -R vlan_isolation 7 -s " .. newworkAddress .. " -i " .. devGuest5G .. " -j " .. (not devGuest5GVlanIsolation and "RETURN" or "REJECT"))
            utils.exec(iptables .. " -w -t filter -R vlan_isolation 8 -d " .. newworkAddress .. " -i " .. devGuest5G .. " -j " .. (not devGuest5GVlanIsolation and "RETURN" or "REJECT"))
        elseif (key == "NAT") then
            local dev2GEnable = source["WLAN2G"] and source["WLAN2G"] == true
            local dev5GEnable = source["WLAN2G"] and source["WLAN2G"] == true
            local devGuest2GEnable = source["WLAN2G_Guest"] and source["WLAN2G_Guest"] == true
            local devGuest5GEnable = source["WLAN5G_Guest"] and source["WLAN5G_Guest"] == true

            utils.exec(iptables .. " -w -t nat -R wifi_nat 1 -i " .. dev2G .. " -j " .. dev2GEnable and "RETURN" or "REJECT")
            utils.exec(iptables .. " -w -t nat -R wifi_nat 2 -i " .. dev5G .. " -j " .. dev5GEnable and "RETURN" or "REJECT")
            utils.exec(iptables .. " -w -t nat -R wifi_nat 3 -i " .. devGuest2G .. "-j " .. devGuest2GEnable and "RETURN" or "REJECT")
            utils.exec(iptables .. " -w -t nat -R wifi_∂nat 4 -i " .. devGuest5G .. "-j " .. devGuest5GEnable and "RETURN" or "REJECT")
        elseif (key == "EnableNginxProxy") then
            if (source == true) then
                utils.exec(iptables .. " -w -t nat -R nginx_proxy 2 -p tcp --dport 80 -j REDIRECT --to-ports 3378");
                utils.exec(iptables .. " -w -t nat -R nginx_proxy 3 -p tcp --dport 443 -j REDIRECT --to-ports 3128");
            else
                utils.exec(iptables .. " -w -t nat -R nginx_proxy 2 -p tcp --dport 80 -j RETURN");
                utils.exec(iptables .. " -w -t nat -R nginx_proxy 3 -p tcp --dport 443 -j RETURN");
            end
        end
    end
end

return firewall
