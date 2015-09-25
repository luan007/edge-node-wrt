require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local uuid = require 'uuid'

persistent "User"
has_p.uid = { is = 'rw', isa = 'string' }
has_p.name = { is = 'rw', isa = 'string' }
has_p.data = { is = 'rw', isa = 'string' }
has_p.version = { is = 'rw', isa = 'number' }
has_p.avatar = { is = 'rw', isa = 'string' }
has_p.lastSeen = { is = 'rw', isa = 'string' }
has_p.thirdparty = { is = 'rw', isa = 'string' }

sql_create = [[
    CREATE TABLE User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid CHAR(64),
        name NCHAR(255),
        data TEXT,
        version INTEGER,
        avatar CHAR(255),
        lastSeen CHAR(24),
        thirdparty TEXT
    )
]]

local conn = User.establish_connection('sqlite3', "orm.db")
conn:execute(User.sql_create)

local exports = {}
exports.Table = User
return exports
