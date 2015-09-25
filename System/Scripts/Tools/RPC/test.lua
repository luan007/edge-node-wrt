local p = print
local uv = require('luv')
local apisocket = require('apisocket')
local inspect = require('inspect')
local cjson = require 'cjson'

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

local server = create_server(function(client)
    p("new client", client)
    apisocket.handle(client, function(...) --onevent
    print("server: error", ...)
    end, function() --onclose
    print("server: socket closed")
    end, function(funcId, params, cb) --oncall
    return { params[1], '1', "helloworld", nil, { nil, 1 } }
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

set_interval(5000, function()
    print("gc...")
    collectgarbage()
    print("count", collectgarbage("count"))
end)

local client = uv.new_pipe(false)
uv.pipe_connect(client, "/tmp/crap", function(err)
    assert(not err, err)
    apisocket.handle(client, function(...)
        print("client: error", ...)
        error("stop")
    end, function()
        print("client: socket closed")
    end)

    for i = 0, 1000000 do
        apisocket.Call(client, 1, { i, "crap", "yea" }, function(err, result)
            if (not err) then
                print("good", result[1])
                --print(result[1], result[2], result[3], result[4])
            else
                print("shit happens", err)
            end
        end)
    end
end)


-- Start the main event loop
uv.run()
uv.walk(uv.close)
uv.run()
uv.loop_close()
