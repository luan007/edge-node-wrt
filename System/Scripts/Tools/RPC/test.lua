local p = print
local uv = require('luv')
local apisocket = require('apisocket')
local inspect = require('inspect')

local function create_server(on_connection)

  local server = uv.new_pipe(false)
  p(1, server)
  uv.pipe_bind(server, "/tmp/crap")

  uv.listen(server, 128, function(err)
    assert(not err, err)
    local client = uv.new_tcp()
	
    uv.accept(server, client)
    on_connection(client)
  end)

  return server
end

local server = create_server(function (client)
  p("new client", client)
  apisocket.handle(client, function(...) 
    print("server: error", ...)
  end, function() 
    print("server: socket closed")
  end)
end)



local function set_interval(interval, callback)
  local timer = uv.new_timer()
  local function ontimeout()
    callback(timer)
  end
  uv.timer_start(timer, interval, interval, ontimeout)
  return timer
end

local i = set_interval(1000, function()
  print("gc...")
  collectgarbage()
  print("count", collectgarbage("count"))
end)

local client = uv.new_pipe(false)
uv.pipe_connect(client, "/tmp/crap", function (err)
  assert(not err, err)
  apisocket.handle(client, function(...) 
    print("client: error", ...)
  end, function() 
    print("client: socket closed")
  end)
     for i=0, 1000000 do
       apisocket.send(client, {
         i, i, i, i, i, i
       })
     end
end)

-- Start the main event loop
uv.run()
uv.walk(uv.close)
uv.run()
uv.loop_close()
