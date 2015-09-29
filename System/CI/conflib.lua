package.path = package.path .. ";/ramdisk/System/Scripts/Tools/?.lua;/ramdisk/System/CI/?.lua"
local utils = require "utils"

exports = {}

exports.sections = {}
exports.sections.__NETWORK = "network"
exports.sections.__WIFI = "wifi"
exports.sections.__FIREWALL = "firewall"
exports.sections.__SYSTEM = "system"
exports.sections.__TIME = "time"
exports.sections.__SSH = "ssh"
exports.sections.__HOSTS = "hosts"
exports.target = {}
exports.target[exports.sections.__NETWORK] = "/etc/config/network.json"
exports.target[exports.sections.__WIFI] = "/etc/config/wifi.json"
exports.target[exports.sections.__FIREWALL] = "/etc/config/firewall.json"
exports.target[exports.sections.__SYSTEM] = "/etc/config/system.json"
exports.target[exports.sections.__TIME] = "/etc/config/time.json"
exports.target[exports.sections.__SSH] = "/etc/config/ssh.json"
exports.target[exports.sections.__HOSTS] = "/etc/config/hosts.json"

function exports.read_config(conf_path)
    local headers = {}
    local rows = {}
    local delimiter = "="
    local f = io.open(conf_path)

    for line in f:lines() do
        local parts = utils.split(line, delimiter)
        local row = parts[1]
        local val = parts[2]
        -- for sorting
        if not utils.contains(headers, row) then
            table.insert(headers, row)
        end
        if (rows[row]) then
            local old = rows[row]
            rows[row] = {}
            if (type(old) == "table") then
                rows[row] = utils.concat(rows[row], old);
            elseif (type(old) == "string") then
                rows[row] = utils.append(rows[row], old)
            end
            rows[row] = utils.append(rows[row], val and val or val)
        else
            rows[row] = val
        end
    end

    return rows, headers
end

function exports.read_json(ename)
    if (exports.target[ename]) then
        local path = exports.target[ename];
        return utils.parse(io.open(path):read("*a"))
    end
end

function exports.write_config(conf_path, rows, headers)
    local buf = ""
    for _, row in ipairs(headers) do
        local o = rows[row]
        if (type(o) == "table") then
            for k, _ in pairs(o) do
                buf = buf .. row .. "=" .. o[k] .. "\n"
            end
        elseif (type(o) == "string") then
            buf = buf .. (string.len(o) > 0 and row .. "=" .. o or row) .. "\n"
        elseif (o == nil) then
            buf = buf .. row .. "\n"
        end
    end

    buf = utils.trimend(buf, "\n")

    if (not utils.md5compare(conf_path, buf)) then
        io.open(conf_path, "w+"):write(buf)
        return true
    else
        return false
    end
end

return exports
