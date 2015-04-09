require("./PermissionDef");
var PermissionTable = {};
function SetPermission(id, buffer) {
    PermissionTable[id] = Encode(Decode(buffer));
}
exports.SetPermission = SetPermission;
function GetPermission(id) {
    return PermissionTable[id];
}
exports.GetPermission = GetPermission;
var _permission_buffer_length = Math.ceil((Object.keys(Permission).length / 2) / 32);
var _perm_length = (Object.keys(Permission).length / 2);
var _GROUP_SYSTEM = _.range(_perm_length);
function Resolve(raw_p) {
    if (!raw_p)
        return undefined;
    for (var i = 0; i < raw_p.length; i++) {
        switch (raw_p[i]) {
            case 0 /* System */:
                return (_GROUP_SYSTEM);
                break;
            default:
                break;
        }
    }
    return raw_p;
}
function Encode(permissions) {
    if (!permissions)
        return undefined;
    permissions = Resolve(permissions);
    var buf = new Array(_permission_buffer_length);
    for (var i = 0; i < buf.length; i++) {
        buf[i] = 0;
    }
    for (var i = 0; i < permissions.length; i++) {
        var bitIndex = permissions[i];
        buf[Math.floor(bitIndex / 32)] |= 1 << (bitIndex % 32);
    }
    return buf;
}
exports.Encode = Encode;
function Decode(permissions) {
    var p = [];
    if (!permissions)
        return p;
    for (var i = 0; i < permissions.length; i++) {
        for (var j = 0; j < 32; j++) {
            if ((permissions[i] & (1 << j)) != 0) {
                p.push(Permission[Permission[i * 32 + j]]);
            }
        }
    }
    return p;
}
exports.Decode = Decode;
function DecodeToString(permissions) {
    var p = [];
    if (!permissions)
        return p;
    for (var i = 0; i < permissions.length; i++) {
        for (var j = 0; j < 32; j++) {
            if ((permissions[i] & (1 << j)) != 0) {
                p.push(Permission[i * 32 + j]);
            }
        }
    }
    return p;
}
exports.DecodeToString = DecodeToString;
function Check(owned, required) {
    if (!required) {
        return true;
    }
    for (var i = 0; i < required.length; i++) {
        if (required[i] == 0)
            continue;
        if (!owned || i >= owned.length)
            return false;
        if ((owned[i] & required[i]) != required[i])
            return false;
    }
    return true;
}
exports.Check = Check;
