package.path = package.path .. ";../?.lua"

local uv = require 'luv'
local dbg = require('dbg')('edge.apisocket')
local cjson = require 'cjson'
local bit = require 'bit'
local common = require 'common'

local exports = {}
local function _onframe(socket, frame)
  print(frame)
  socket = nil
  frame = nil
end

local function ondata(socket, chunk)
  local client = socket.client
  local cursor = 1
  while cursor <= #chunk do
      repeat
        if socket.len_remain == 0 then
          if socket.cur_pack then
            _onframe(socket, socket.cur_pack)
            socket.cur_pack = nil
          end
          if socket.frag_header or cursor + (4 - (socket.frag_header and #socket.frag_header or 0)) >= #chunk then
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
            frag = nil;
            if #socket.frag_header >= 4 then
              socket.len_remain =
                bit.bor(
                              bit.lshift(string.byte(frag_header, 1), 24),
                              bit.lshift(string.byte(frag_header, 2), 16),
                              bit.lshift(string.byte(frag_header, 3), 8),
                              string.byte(frag_header, 4)
                )
              socket.frag_header = nil;
            else
              break
            end
          else
            socket.len_remain =
                  bit.bor(
                              bit.lshift(string.byte(chunk, 0 + cursor), 24),
                              bit.lshift(string.byte(chunk, 1 + cursor), 16),
                              bit.lshift(string.byte(chunk, 2 + cursor), 8),
                              string.byte(chunk, 3 + cursor)
                  )
            cursor = cursor + 4
			    print('len', socket.len_remain)					
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
            return
          end
        end
        local copy_length = ((#chunk - cursor + 1) < socket.len_remain and (#chunk - cursor + 1) or socket.len_remain)
		    print('cp', copy_length)		
        if (socket.cur_pack) then
          	socket.cur_pack = socket.cur_pack .. string.sub(chunk, cursor, cursor + copy_length)
		    end
		cursor = cursor + copy_length
		socket.len_remain = socket.len_remain - copy_length
		print(socket.len_remain)
      if (socket.cur_pack and socket.len_remain == 0) then
        _onframe(socket, socket.cur_pack)
        socket.cur_pack = nil;
      end
    until true
  end
  cursor= nil
  client= nil
  chunk = nil
end


function exports.release(socket)
  uv.read_stop(socket)
  uv.close(socket)
end

function exports.handle(socket, onerr, onend)

  local sockObj = {
    client = socket,
    frag_header = nil,
    cur_pack = nil,
    len_remain = 0
  }


  uv.read_start(sockObj.client, function (err, chunk)
    if err then
      debug(err)
      release(sockObj.client)
      onend()
      return onerr(err)
    end
    if chunk then
      ondata(sockObj, chunk)
    else
      --boom, you're done
      release(sockObj.client)
      onend()
    end
  end)

  -- p("writing from client")
  -- uv.write(client, "Hello")
  -- uv.write(client, "World")

end


local dt
function exports.send(client, frame)

  dt = cjson.encode(frame)
  local length = #dt
  if (length + 4 > common.MAX_PACKET) then
    return error("Body is Too Large")
  end
  local lenbytes = string.char(bit.band(bit.rshift(length, 24), 255)) ..
                   string.char(bit.band(bit.rshift(length, 16), 255)) ..
                   string.char(bit.band(bit.rshift(length, 8) , 255)) ..
                   string.char(bit.band(length                , 255))
  dt = lenbytes .. dt
  --uv.stream_set_blocking(client, true)  
  uv.write(client, dt)   
  --uv.stream_set_blocking(client, false)  
  
  dt = nil  
end


return exports
