require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local uuid = require 'uuid'

persistent "Persist"
has_p.uid = { is = 'rw', isa = 'string' }
has_p.data = { is = 'rw', isa = 'string' }

sql_create = [[
    CREATE TABLE Persist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid CHAR(64),
        data TEXT
    )
]]

local conn = Persist.establish_connection('sqlite3', "orm.db")
conn:execute(Persist.sql_create)

local exports = {}
exports.Table = Persist
return exports
