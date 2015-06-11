function Log(msg)
	local info = debug.getinfo(2, "nl")
    local filename = "/var/log/lua.log"
	local wfile=io.open(filename, "a+")
	assert(wfile)
	wfile:write(os.date("%Y-%m-%d %H:%m:%S ")..info.name.."("..info.currentline.."): "..msg.."\n")
	wfile:close()
end

