require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local uuid = require 'uuid'

persistent "Application"
has_p.uid = { is = 'rw', isa = 'string' }
has_p.appsig = { is = 'rw', isa = 'string' }
has_p.name = { is = 'rw', isa = 'string' }
has_p.urlName = { is = 'rw', isa = 'string' }


sql_create = [[
    CREATE TABLE Application (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid CHAR(64),
        appsig CHAR(32),
        name CHAR(255),
        urlName CHAR(255)
    )
]]

local exports = {}

function exports.init(dbpath)
    local conn = Application.establish_connection('sqlite3', dbpath)
    conn:execute(Application.sql_create)

    return Application
end

return exports

