local bit = require("bit");

function GetRPCSocket()
	local timeout = 1000
	local sock = ngx.socket.tcp()
	sock:settimeout(timeout);
    local ok, err = sock:connect(API_Endpoint)
    if not ok then
       	ngx.log(ngx.ERR,"failed to connect socket: ", err)
    end
    return sock, err
end

function RawRPC(wait_for_resp, sock, target, params)
	-- append uid to params
	local uid = ngx.var._user == nil and "" or ngx.var._user
	table.insert(params, uid)
	-- append uid to params

	local targetID = API[target]
	local reqParams = {0,targetID, params}
	local reqMsg = cjson.encode(reqParams)
	
	local len=#reqMsg;
	local a=bit.band(bit.rshift(len,24),0xff)
	local b=bit.band(bit.rshift(len,16),0xff)
	local c=bit.band(bit.rshift(len,8),0xff)
	local d=bit.band(len,0xff)

	local ss=string.char(d)..string.char(c)..string.char(b)..string.char(a)..reqMsg;
	local bytes, err = sock:send(ss)
	if err then 
		ngx.log(ngx.ERR,"sock send err: " .. err)
		return nil, err
	end
	if wait_for_resp then
		local resRecv, err = _recv(sock) --recive
		if err then 
			return nil, err
		end
		local ok, err = sock:setkeepalive(0)
	    if not ok then
			ngx.log(ngx.ERR,"failed to set reusable: ", err)
			return nil, err
		end
		local recvJson = cjson.decode(resRecv)
		local err = nil
		if recvJson[3][1]~=ngx.null then 
			err = cjson.encode(recvJson[3][1])
		end
		return recvJson[3][2], err
	else
		--resp
		return nil, nil
	end
end


function RPCCall(sock, target, ...)
	return RawRPC(true, sock, target, {...})
end

function RPCSend(sock, target, ...)
	return RawRPC(false, sock, target, {...})
end

function _recv(sock)
	local bufBody = ""
	local bufLen = 0
	local bodyLen = 0 
	local totalLen = 0 
	local head, err, partial = sock:receive(4)
	if err then 
		ngx.log(ngx.ERR, "receive err: " .. err) 
		return nil, err
	end
	local b = string.byte(head,2)
	local c = string.byte(head,3)
	local d = string.byte(head,4)
	bodyLen = string.byte(head,1) + bit.lshift(b,8) + bit.lshift(c,16) + bit.lshift(d,24)
	local datas, err, partial = sock:receive(bodyLen)
	if err then 
		ngx.log(ngx.ERR, "receive err: " .. e) 
		return nil, err
	end
	return datas, nil
end