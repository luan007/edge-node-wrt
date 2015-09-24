-- apt-get install libsqlite3-dev
-- luarocks install lua-coat
-- luarocks install lua-coatpersistent-luasql

require 'Coat.Persistent'
require 'Coat.Persistent'.trace = print
local inspect = require 'inspect'

persistent 'Pet'

has_p.name = { is = 'rw', isa = 'string' }
has_p.species = { is = 'rw', isa = 'string' }

sql_create = [[
    CREATE TABLE pet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name CHAR(128),
        species CHAR(128)
    )
]]


local conn = Pet.establish_connection('sqlite3', "orm.db")
conn:execute(Pet.sql_create)

-- doggy = Pet.create {name = "happy", species = "dog"}
-- doggy:save()

local iterator = Pet.find("name is null")
local p = iterator()
while p do
    p:delete()
    p = iterator()
end
