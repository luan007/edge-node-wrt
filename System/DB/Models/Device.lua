require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local uuid = require 'uuid'

persistent "Device"
has_p.uid = { is = 'rw', isa = 'string' }
has_p.assumptions = { is = 'rw', isa = 'string' }
has_p.hwaddr = { is = 'rw', isa = 'string' }
has_p.busname = { is = 'rw', isa = 'string' }
has_p.busdata = { is = 'rw', isa = 'string' }
has_p.state = { is = 'rw', isa = 'number' }
has_p.time = { is = 'rw', isa = 'string' }
has_p.config = { is = 'rw', isa = 'string' }
has_p.ownership = { is = 'rw', isa = 'string' }
has_p.thirdparty = { is = 'rw', isa = 'string' }
has_p.version = { is = 'rw', isa = 'number' }
has_p.orbitVersion = { is = 'rw', isa = 'number' }

sql_create = [[
    CREATE TABLE Device (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid CHAR(64),
        assumptions TEXT,
        hwaddr CHAR(32),
        busname CHAR(32),
        busdata TEXT,
        state INTEGER,
        time CHAR(24),
        config TEXT,
        ownership CHAR(64),
        thirdparty TEXT,
        version INTEGER,
        orbitVersion INTEGER
    )
]]

local exports = {}
function exports.init(dbpath)
    local conn = Device.establish_connection('sqlite3', dbpath)
    conn:execute(Device.sql_create)
end

exports.dt = Device
return exports