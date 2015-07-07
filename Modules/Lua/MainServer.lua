-- Catch all Auth
function MainAuth()

	local clientIp = ngx.var.remote_addr
	--filter clientIp
	if not clientIp then
		return ngx.exit(ngx.HTTP_FORBIDDEN)
	end

	ngx.var._auth = ""

	local socket, err = GetRPCSocket()
	if err then
		ngx.say("RPC Socket Error : " .. err)
		return ngx.exit(ngx.HTTP_OK)
	end
	
	local dev, err = RPCCall(socket, "Proxy.CurrentDevHeader", clientIp);
	if err or not dev then
		ngx.say("Unmanaged device is not allowed   " .. err)
		return ngx.exit(ngx.HTTP_OK)
	end
	ngx.var._dev = dev

	local cookie, err = ck:new()
	if not cookie then
	    ngx.log(ngx.ERR, err)
	    ngx.exit(ngx.HTTP_FORBIDDEN)
	    return
	end

	Log("IP: " ..clientIp .. " Device: " .. dev .. " Host:" .. ngx.var.host)

	local field, err = cookie:get("edge_atoken")
	if not field then
		return
	end

	socket, err = GetRPCSocket()
	local result, err = RPCCall(socket, "Proxy.AuthUser", field, dev)
	if not err and result then
		ngx.var._auth = "1"
		ngx.var._user = result
		Log("After Proxy.AuthUser Token_UID: " .. result)
	end
end

function MainAccess()

	local socket, err = GetRPCSocket()
	if err then 
		ngx.say("RPC Socket Error : " .. err)
	end
	local result, err = RPCCall(socket, "Proxy.GetTarget", ngx.var.host, ngx.var.request_uri, ngx.var._auth)
	if err then
		return ngx.say("GetTarget Call Error : " .. err)
	end
	ngx.var._target = result[1]
	ngx.var._cookie_path = result[2]
	Log("_target: " .. result[1] .. "\n host:" .. ngx.var.host .. "\n request_uri: " .. ngx.var.request_uri .. "\n _auth: " .. ngx.var._auth)
end

local function trim(s)
   return string.match(s,"^()%s*$") and "" or string.match(s,"^%s*(.*%S)")
end

local function touch(data, prefix, domain)
	local key = ""
	local val = ""
	local eq
	local hasPath = false
	local hasDomain = false
	local hasHttpOnly = false
	local result = ""

	for pair in string.gmatch(data, "[^;]+") do
		eq = string.find(pair, "=")
		if eq then
			key = string.lower(trim(string.sub(pair, 1, eq-1)))
			val = trim(string.sub(pair, eq+1))
		else
			key = string.lower(trim(pair))
			val = nil
		end
		if key == "path" then
			hasPath = true
			val = prefix .. val
		elseif key == "domain" and not domain == nil then
			hasDomain = true
			--val = domain
		elseif key == "httponly" then
			hasHttpOnly = true 
		end
		result = result .. key .. ((val == nil and "") or "=" .. val) .. ';'
	end

	if not hasHttpOnly then
		result = result .. "httpOnly;"
	end

	if not hasDomain and not domain == nil then
	--	result = result .. "domain=" .. domain .. ";"
	end

	if not hasPath then
		result = result .. "path=" .. prefix .. ";"
	end

	return result
end


function MainHeadFilter()
    local cookie, err = ck:new()
    local fields, err = cookie:get_all()
    local cookies = ngx.header['Set-Cookie']
    if type(cookies) ~= "table" then cookies = {cookies} end  
    local newcookies = {} 
    for i, val in ipairs(cookies) do 
        local newval = touch(val, ngx.var._cookie_path)
        table.insert(newcookies, newval) 
    end 
    ngx.header['Set-Cookie'] = newcookies
    ngx.header['Server'] = "EDGE_GATE V1"
    ngx.header['X-Powered-By'] = "Edge Router OS (dev)"
    -- Log("head")
end


function Dummy()
	ngx.say("hi")
end