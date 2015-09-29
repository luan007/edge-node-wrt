local exports = {}

exports.MAX_PACKET = 2048 * 1024
exports.FUNC_TIMEOUT = 10
exports.MSG_REQ = 0
exports.MSG_RESP = 1
exports.MSG_EVENT = 2
exports.CHECK_BEFORE_SEND = true
exports.PATCH_JSON = true

function exports.patchJSON(obj, nullrep)
    --recurrrs
    if(not exports.PATCH_JSON) then return obj end
    if(obj == nullrep) then return nil end
    if(type(obj) ~= 'table') then return obj end
    if(type(obj) == 'table') then
        for k, v in pairs(obj) do
            obj[k] = exports.patchJSON(v, nullrep)
        end
    end
    return obj
end

return exports