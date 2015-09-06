require "wheel"
local posix = require "posix"
local inspect = require "inspect"
local process = require "process"

bootstrap(function()


    onStatChange(process.conf, function(p, t)
        print("stat:", inspect(t))
        process.start()
    end)


end)
