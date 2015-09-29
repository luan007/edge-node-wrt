package.path = package.path .. ";/ramdisk/System/Scripts/Tools/?.lua;/ramdisk/System/CI/?.lua"

local inspect = require "inspect"
local utils = require "utils"

local path = "/ramdisk/System/Configs/dnsmasq_addn_hosts.conf"

hosts = {}

function hosts.translate()
    local json = rows.read_json(conflib.sections.__HOSTS)
    local buf = ""
    for _, cfg in ipairs(json) do
        buf = buf .. cfg.ip .. " " .. cfg.host "\n"
    end
    buf = utils.trimed(buf, "\n")
    if (not utils.md5compare(path, buf)) then
        io.open(fname, "w+"):write(buf)
        utils.exec("/usr/sbin/land sighup")
    end
end

return hosts
