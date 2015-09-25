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

local exports = {}
function exports.init(dbpath)
    local conn = Persist.establish_connection('sqlite3', dbpath)
    conn:execute(Persist.sql_create)
    return Persist
end

return exports
