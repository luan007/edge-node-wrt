package.path = package.path .. ";/ramdisk/System/Scripts/Tools/?.lua;/ramdisk/System/CI/?.lua"

local inspect = require "inspect"
local utils = require "utils"

local path = "/ramdisk/System/Configs/dnsmasq_server_file.conf"

hosts = {}

function hosts.translate()
    print(">>dns")
    local json = rows.read_json(conflib.sections.__DNS)
    local buf = ""
    for _, ip in ipairs(json) do
        buf = buf .. "server=" .. ip .. "\n"
    end
    buf = utils.trimend(buf, "\n")
    if (not utils.md5compare(path, buf)) then
        io.open(path, "w+"):write(buf)
        utils.exec("/usr/sbin/land sighup")
    end
end

return hosts
