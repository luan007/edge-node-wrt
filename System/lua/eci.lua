---	arg[2]: username
---	arg[3]: userpwd
---	arg[4]: number

local status_conf	= "/etc/dnsmasq.status.json"
local sighup_conf	= "/etc/dnsmasq.sighup.json"
local addn_hosts	= "/etc/dnsmasq.addn.hosts.conf"
local dhcp_hosts	= "/etc/dnsmasq.dhcp.hostsfile.conf"
local servers_file	= "/etc/dnsmasq.server.file.conf"

function read_file(path)
	local f = io.open(path, "rb")
	local c = f:read("*a")
	f:close()
	return c
end

-- 
-- content : a string
--
function write_file(path, content)
	local f = io.open(path, "w+")
	f:write(content)
	f:close()
end

-- 
-- array : a JSON array
-- 
function write_lines(path, array)
	local f = io.open(path, "w+")
	for _, v in pairs(array) do
		f:write(v, "\n")
	end
	f:close()
end

function mini_conf(network_address, dhcp_start, dhcp_end, domain)
	return
		"dhcp-option=6,"..network_address.."\n"..
		"dhcp-range="..dhcp_start..","..dhcp_end.."\n"..
		"listen-address="..network_address..",127.0.0.1\n"..
		"expand-hosts\n"..
		"stop-dns-rebind\n"..
		"dhcp-sequential-ip\n"..
		"domain="..(domain or "edge").."\n"..
		"cache-size=4096\n"..
		"server=8.8.8.8\n"..
		"server=4.4.4.4\n"..
		"address=/.wi.fi/"..network_address.."\n"..
		"address=/.wifi.network/"..network_address.."\n"..
		"address=/.ed.ge/"..network_address.."\n"..
		"address=/.wifi/"..network_address.."\n"..
		"addn-hosts="..addn_hosts.."\n"..
		"dhcp-hostsfile="..dhcp_hosts.."\n"..
		"servers-file="..servers_file.."\n"
end

function main()
	local t = arg[1]
	print(t)
	if not t then 
		print("invalid arguments.")
	else
		print(t)
		if t == "dnsmasq_status" then
			local config = cjson.decode(read_file(status_conf))
			local content = mini_conf(config.network_address
				, config.dhcp_start
				, config.dhcp_end
				, config.domain)
			print(content)
			write_file(dnsmasq_conf, content)
		elseif t == "dnsmasq_sighup" then
			local config = cjson.decode(read_file(sighup_conf))
			write_lines(addn_hosts, config.addn_hosts)
			write_lines(dhcp_hosts, config.dhcp_hosts)
			write_lines(servers_file, config.servers_file)
		elseif t == "ppp_conf" then
			local account = arg[2]
			local pwd = arg[3] 
			local number = arg[4]
			local secrets = '"'..account..'"\t*\t"'..pwd..'"'
			write_file(ppp_secrets, secrets)
			write_file(chap_secrets, secrets)
		end
	end
end

main()
