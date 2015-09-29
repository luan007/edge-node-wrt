local bit = require 'bit'
local PermissionTable = {}

PermissionOps = {}

Permission = {
    All = 0,
    Proxy = 1,
    Event = 2,
    IO = 3,
    DeviceAccess = 4,
    UserAccess = 5,
    Sensor = 6,
    AnyApp = 7,
    AppCrossTalk = 8,
    AppPreLaunch = 9,
    PortExposure = 10,
    Network = 11,
    Configuration = 12,
    Launcher = 13,
    Driver = 14,
}

local PermissionCount = 0
for _ in pairs(Permission) do
    PermissionCount = PermissionCount + 1
end

local PermArrLength = math.ceil(PermissionCount / 32)

function PermissionOps.Encode(Perms)
    if (not Perms) then return nil end

    local permArr = { n = PermArrLength }

    for i = 1, PermArrLength do
        permArr[i] = 0
    end

    for i = 1, #Perms do
        local bitIndex = Perms[i] -- 0 ~ N
        permArr[math.floor(bitIndex / 32) + 1] =
        bit.bor(permArr[math.floor(bitIndex / 32) + 1],
            bit.lshift(1, bitIndex % 32))
        --buf[Math.floor(bitIndex / 32)] |= 1 << (bitIndex % 32); //flip bit
    end

    return permArr
end

function PermissionOps.Set(id, Perm)
    PermissionTable[id] = PermissionOps.Encode(Perm)
end

function PermissionOps.Get(id)
    return PermissionTable[id]
end

function PermissionOps.Check(owned, required)
    if (not required) then return true end
    if (owned and owned[1] and bit.band(owned[1], 1) == 1) then return true end --system
    for i = 1, #required do
        if (required[i] ~= 0 and (owned == nil or owned[i] == nil or owned[i] == 0)) then
            return false
        elseif ( bit.band(owned[i], required[i]) ~= required[i] ) then
            return false
        end
    end
    return true
end

--local s = PermissionOps.Encode({Permission.All})
--local a = PermissionOps.Encode({Permission.Proxy, Permission.Sensor})
--local b = PermissionOps.Encode({Permission.Proxy, Permission.Sensor, Permission.AnyApp})
--
--print(PermissionOps.Check(a, b))    --f
--print(PermissionOps.Check(b, a))    --t
--print(PermissionOps.Check(nil, a))  --f
--print(PermissionOps.Check(a, nil))  --t
--print(PermissionOps.Check(s, a))    --t