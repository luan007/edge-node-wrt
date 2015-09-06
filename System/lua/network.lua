require "wheel"
local posix = require "posix"
local inspect = require "inspect"
local process = require "process"
local cjson = require "cjson"

local cmd = "dnsmasq"
local conf = "/etc/dnsmasq.conf"
local status = "/etc/dnsmasq.status.json"
local dict = "/etc/dnsmasq.dict.json"

bootstrap(function()

    onStatChange(conf, function(p, t)
        print("stat:", inspect(t))
        process.start(cmd, "-C", conf, "-k")
    end)


end)
