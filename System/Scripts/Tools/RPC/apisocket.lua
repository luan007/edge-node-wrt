local ffi = require 'ffi'
local uv = require 'luv'
local dbg = require('dbg')('edge.apisocket')
local cjson = require 'cjson'
local bit = require 'bit'
local common = require 'common'
local exports = {}


local map = {}
local gen = {}
local _free = {}
local timeout = {}

local function alloc()
    if (#_free == 0) then
        --allocate
        gen[#map + 1] = 0
        return #map + 1
    else
        local spot = _free[#_free]
        _free[#_free] = nil
        return spot
    end
end

local function free(spot)
    if not map[spot] then return end
    map[spot] = nil
    timeout[spot] = nil
    _free[#_free + 1] = spot
end

function exports.Emit(client, id, params)
    print("send event")
    send(client, { common.MSG_EVENT, id, params });
    params = nil
end

function exports.Call(client, id, params, callback)
    local p = alloc()
    local called = 0
    local function cb(err, result)
        if (called ~= 1) then
            free(p)
            called = 1
            callback(err, result)
            callback = nil
            return nil
        end
    end

    map[p] = cb
    timeout[p] = common.FUNC_TIMEOUT
    gen[p] = gen[p] + 1
    send(client, { common.MSG_REQ, id, params, p, gen[p] });
    params = nil
end

local function parseFrame(socket, frame)

    if (frame[1] == common.MSG_EVENT) then
        print("on event!")
        return socket.onevent(frame[2], frame[3], socket)
    end

    if (frame[1] == common.MSG_REQ) then
        local called = 0
        local function cb(err, result)
            if (called ~= 1) then
                called = 1
                send(socket.client, { common.MSG_RESP, { err, result }, frame[4], frame[5] });
                frame = nil
                return
            end
        end

        local state, result_or_err = pcall(function()
            return socket.oncall(frame[2], frame[3], cb, socket)
        end)

        if (called == 1) then
            frame = nil
            return
        end --you called cb as sync method
        if (state == false) then
            called = 1
            send(socket.client, { common.MSG_RESP, { result_or_err, nil }, frame[4], frame[5] });
            frame = nil
            return
        end
        if (result_or_err) then
            called = 1
            --sync method
            send(socket.client, { common.MSG_RESP, { nil, result_or_err }, frame[4], frame[5] });
            frame = nil
            return
        end

        send(socket.client, { common.MSG_RESP, { "Host function did not return anything", nil }, frame[4], frame[5] });
        frame = nil
        return
    end
    if (frame[1] == common.MSG_RESP) then
        if (map[frame[3]] and gen[frame[3]] == frame[4]) then
            pcall(function() map[frame[3]](unpack(frame[2])) end)
            free(frame[3])
            return
        end
    end
    return
    --return socket.onerr("frame err", inspect(frame))
end

local function _onframe(socket, frame)
    local state, dt = pcall(function()
        dbg("incoming - ", frame)
        return common.patchJSON(cjson.decode(frame), cjson.null)
    end)
    if (not state) then return socket.onerr(dt) end
    if (#dt < 2) then return socket.onerr('Malformed Packet') end
    parseFrame(socket, dt)
end

local function ondata(socket, chunk)
    local cursor = 1
    while cursor <= #chunk do
        repeat
            if socket.len_remain == 0 then
                if socket.cur_pack then
                    _onframe(socket, socket.cur_pack)
                    socket.cur_pack = nil
                end
                if socket.frag_header
                        or cursor + (4 - (socket.frag_header and #socket.frag_header or 0))
                        >= #chunk then
                    if socket.frag_header == nil then
                        socket.frag_header = ""
                    end

                    local rem = 0
                    if (cursor + (4 - #socket.frag_header) >= #chunk) then
                        rem = #chunk - cursor
                    else
                        rem = 4
                    end
                    socket.frag_header = socket.frag_header .. string.sub(chunk, cursor, rem)
                    cursor = cursor + rem
                    if #socket.frag_header >= 4 then
                        socket.len_remain =
                        bit.bor(bit.lshift(string.byte(socket.frag_header, 1), 24),
                            bit.lshift(string.byte(socket.frag_header, 2), 16),
                            bit.lshift(string.byte(socket.frag_header, 3), 8),
                            string.byte(socket.frag_header, 4))
                        socket.frag_header = nil;
                    else
                        break
                    end
                else
                    socket.len_remain =
                    bit.bor(bit.lshift(string.byte(chunk, 0 + cursor), 24),
                        bit.lshift(string.byte(chunk, 1 + cursor), 16),
                        bit.lshift(string.byte(chunk, 2 + cursor), 8),
                        string.byte(chunk, 3 + cursor))
                    cursor = cursor + 4
                    dbg('len', socket.len_remain)
                end
                if (socket.len_remain > common.MAX_PACKET) then
                    socket.cur_pack = nil;
                    dbg('error', "Packet is too long : ", socket.len_remain)
                    --warning, this socket should be discarded, otherwise its behaviour might be unpredictable
                else
                    socket.cur_pack = "";
                end
                if (cursor >= #chunk) then
                    chunk = nil
                    return nil
                end
            end
            local copy_length =
            ((#chunk - cursor + 1) < socket.len_remain and (#chunk - cursor + 1) or socket.len_remain)
            dbg('cp', copy_length)
            if (socket.cur_pack) then
                socket.cur_pack = socket.cur_pack .. string.sub(chunk, cursor, cursor + copy_length)
            end
            cursor = cursor + copy_length
            socket.len_remain = socket.len_remain - copy_length
            dbg(socket.len_remain)
            if (socket.cur_pack and socket.len_remain == 0) then
                _onframe(socket, socket.cur_pack)
                socket.cur_pack = nil;
            end
        until true
    end
end

function exports.release(socket)
    uv.read_stop(socket)
    uv.close(socket)
    socket = nil
end

function exports.handle(socket, _onerr, onend, _oncall, _onevent)

    local sockObj = {
        client = socket,
        frag_header = nil,
        cur_pack = nil,
        len_remain = 0,
        oncall = _oncall,
        onevent = _onevent,
        onerr = _onerr
    }

    uv.read_start(sockObj.client, function(err, chunk)
        if err then
            debug(err)
            exports.release(sockObj.client)
            sockObj.frag_header = nil
            sockObj.cur_pack = nil
            sockObj.oncall = nil
            sockObj.onevent = nil
            sockObj.onerr = nil
            sockObj.client = nil
            onend()
            return onerr(err)
        end
        if chunk then
            ondata(sockObj, chunk)
        else
            --boom, you're done
            exports.release(sockObj.client)
            sockObj.frag_header = nil
            sockObj.cur_pack = nil
            sockObj.oncall = nil
            sockObj.onevent = nil
            sockObj.onerr = nil
            sockObj.client = nil
            onend()
        end
    end)
end

local dt
function send(client, frame)
    dt = cjson.encode(frame)
    dbg("outgoing - ", dt)
    local length = #dt
    if (length + 4 > common.MAX_PACKET) then
        return error("Body is Too Large")
    end
    local lenbytes = string.char(bit.band(bit.rshift(length, 24), 255)) ..
            string.char(bit.band(bit.rshift(length, 16), 255)) ..
            string.char(bit.band(bit.rshift(length, 8), 255)) ..
            string.char(bit.band(length, 255))
    dt = lenbytes .. dt
    --uv.stream_set_blocking(client, true)
    uv.write(client, dt)
    --uv.stream_set_blocking(client, false)
end

local function timeoutLoop()
    for i = 1, #map, 1 do
        if map[i] and timeout[i] then
            timeout[i] = timeout[i] - 1
            if timeout[i] <= 0 then
                pcall(function() map[i]('Function Timed-Out') end)
                free(i)
            end
        end
    end
end

local timer = uv.new_timer()
uv.timer_start(timer, 3000, 3000, timeoutLoop) --resolution

return exports
