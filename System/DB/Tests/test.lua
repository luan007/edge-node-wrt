--
-- prerequisites:
--
-- apt-get install libsqlite3-dev
-- luarocks install lua-coat
-- luarocks install lua-coatpersistent-luasql
-- luarocks install uuid

package.path = package.path .. ";../?.lua"
require 'Coat.Persistent'.trace = print

local inspect = require "inspect"
local uuid = require "uuid"

--init
local db = require "Storage"
db.init()

--itearate
print("DB tables:")
for k, _ in pairs(db.ds) do
    print(k)
end

--retrieve table
local appTable = db.ds.Application

--insert
local app = appTable.create{
    uid = uuid(),
    appsig = "holy",
    name = "mr.xie",
    urlName = "mr.xie"
}
app:save()

--select
local iterator = appTable.find("id > 0")
local cur = iterator()
while cur do
    print(inspect(cur))
    cur = iterator()
end

--update
iterator = appTable.find("id = 1")
app = iterator()
if app then
    app.name = "mr.biber"
    app.urlName = "holy.justin"
    app:save()
end

--select
local iterator = appTable.find("id = 1")
local cur = iterator()
while cur do
    print(inspect(cur))
    cur = iterator()
end


