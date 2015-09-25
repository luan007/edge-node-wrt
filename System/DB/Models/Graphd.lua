require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local uuid = require 'uuid'

persistent "Graphd"
has_p.name = { is = 'rw', isa = 'string' }
has_p.numericDate = { is = 'rw', isa = 'string' }


sql_create = [[
    CREATE TABLE Graphd (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name CHAR(32),
        numericDate CHAR(32)
    )
]]

local conn = Graphd.establish_connection('sqlite3', "orm.db")
conn:execute(Graphd.sql_create)

local exports = {}
exports.Table = Graphd
return exports
