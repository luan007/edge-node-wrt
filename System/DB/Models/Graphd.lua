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

local exports = {}

function exports.init(dbpath)
    local conn = Graphd.establish_connection('sqlite3', dbpath)
    conn:execute(Graphd.sql_create)
    return Graphd
end

return exports
