package.path = package.path .. ";/ramdisk/System/DB/Models/?.lua"

require 'Coat.Persistent'.trace = print

local models = {
    "Application",
    "Device",
    "Graphd",
    "Message",
    "Persist",
    "Ticket",
    "Traffic",
    "User"
}

local dbpath = "/var/main.db"

storage = {
    ds = {}
}

function storage.init()
    for _, v in ipairs(models) do
        local table = require(v)
        storage.ds[v] = table.init(dbpath)
    end
end

function storage.connect(table)
    table.establish_connection("sqlite3", dbpath)
end

return storage