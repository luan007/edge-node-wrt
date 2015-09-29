local p = print
local uv = require('luv')
local apisocket = require('apisocket')
--local inspect = require("inspect")
--local sandbox = require('sandbox')

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

create_server(function(client)
    p("new client", client)
    apisocket.handle(client, function(...) --onevent
    print("server: error", ...)
    end, function() --onclose
    print("server: socket closed")
    end, function(funcId, params, cb, socket) --oncall
    apisocket.Emit(client, funcId, { "hehe", { test = {1,2,3,4,5} } })
    return { params[1], funcId, "helloworld", nil, { nil, 1 } }
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


--
--
--
--local client = uv.new_pipe(false)
--uv.pipe_connect(client, "/tmp/crap", function(err)
--    assert(not err, err)
--
--    API = sandbox(client, {
--        ["Dummy.Thing"] = 1,
--        ["Some.Wat"] = 2
--    }, {
--        ["Event.Demo"] = 1
--    })
--
--    API.Event.Demo.listen(function(...)
--        print(inspect({...}))
--    end)
--
--    for i = 1, 10000 do
--        API.Dummy.Thing(i, function(err, result)
--            if (err) then
--                return error(err)
--            end
--            print('good', inspect(result))
--        end)
--    end
--end)
--




-- Start the main event loop
uv.run()
uv.walk(uv.close)
uv.run()
uv.loop_close()

