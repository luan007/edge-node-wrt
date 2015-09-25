require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local uuid = require 'uuid'

persistent "Message"
has_p.uid = { is = 'rw', isa = 'string' }
has_p.source = { is = 'rw', isa = 'string' }
has_p.senderType = { is = 'rw', isa = 'string' }
has_p.sender = { is = 'rw', isa = 'string' }
has_p.receiverType = { is = 'rw', isa = 'string' }
has_p.receiver = { is = 'rw', isa = 'string' }
has_p.action = { is = 'rw', isa = 'string' }
has_p.content = { is = 'rw', isa = 'string' }
has_p.timeline = { is = 'rw', isa = 'number' }
has_p.notice = { is = 'rw', isa = 'number' }
has_p.read = { is = 'rw', isa = 'number' }
has_p.readTime = { is = 'rw', isa = 'string' }
has_p.sendTime = { is = 'rw', isa = 'string' }

sql_create = [[
    CREATE TABLE Message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid CHAR(64),
        source CHAR(32),
        senderType CHAR(32),
        sender CHAR(32),
        receiverType CHAR(32),
        receiver CHAR(32),
        action CHAR(32),
        content TEXT,
        timeline INTEGER,
        notice INTEGER,
        read INTEGER,
        readTime CHAR(24),
        sendTime CHAR(24)
    )
]]

local conn = Message.establish_connection('sqlite3', "orm.db")
conn:execute(Message.sql_create)

local exports = {}
exports.Table = Message
return exports