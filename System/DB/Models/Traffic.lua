require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local uuid = require 'uuid'

persistent "Traffic"
has_p.uid = { is = 'rw', isa = 'string' }
has_p.internet_up_pkts = { is = 'rw', isa = 'number' }
has_p.internet_up_bytes = { is = 'rw', isa = 'number' }
has_p.internet_down_pkts = { is = 'rw', isa = 'number' }
has_p.internet_down_bytes = { is = 'rw', isa = 'number' }
has_p.intranet_up_pkts = { is = 'rw', isa = 'number' }
has_p.intranet_up_bytes = { is = 'rw', isa = 'number' }
has_p.intranet_down_pkts = { is = 'rw', isa = 'number' }
has_p.intranet_down_bytes = { is = 'rw', isa = 'number' }

sql_create = [[
    CREATE TABLE Traffic (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid CHAR(64),
        internet_up_pkts INTEGER,
        internet_up_bytes INTEGER,
        internet_down_pkts INTEGER,
        internet_down_bytes INTEGER,
        intranet_up_pkts INTEGER,
        intranet_up_bytes INTEGER,
        intranet_down_pkts INTEGER,
        intranet_down_bytes INTEGER
    )
]]

local exports = {}
function exports.init(dbpath)
    local conn = Traffic.establish_connection('sqlite3', dbpath)
    conn:execute(Traffic.sql_create)
    return Traffic
end

return exports
