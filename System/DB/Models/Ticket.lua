require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local uuid = require 'uuid'

persistent "Ticket"
has_p.uid = { is = 'rw', isa = 'string' }
has_p.expire = { is = 'rw', isa = 'number' }
has_p.device_uid = { is = 'rw', isa = 'string' }
has_p.owner_uid = { is = 'rw', isa = 'string' }
has_p.attributes = { is = 'rw', isa = 'string' }
has_p.accessTime = { is = 'rw', isa = 'string' }

sql_create = [[
    CREATE TABLE Ticket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid CHAR(64),
        expire INTEGER,
        device_uid CHAR(64),
        owner_uid CHAR(64),
        attributes TEXT,
        accessTime CHAR(24)
    )
]]

local conn = Ticket.establish_connection('sqlite3', "orm.db")
conn:execute(Ticket.sql_create)

local exports = {}
exports.Table = Ticket
return exports
