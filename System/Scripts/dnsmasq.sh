#!/usr/bin/env ash

#!/usr/bin/env ash

conftime=`stat -c %Y ../dnsmasq.conf`

while [ $conftime -gt 0 ]
do
	modtime=`stat -c %Y test.conf`
	if [ $conftime -ne $modtime ]
	then
		echo $modtime conf was changed.
		conftime=$modtime
	fi
done

dnsmasq -k --dhcp-script=/tmp/fdsock/8350af088c0741ab9f4f7249be558b18.t --dhcp-option=46,8 --dhcp-option=6,192.168.66.1 --listen-address=192.168.66.1,127.0.0.1 --expand-hosts --stop-dns-rebind --dhcp-sequential-ip --domain=edge --dhcp-range=192.168.66.10,192.168.66.230 --cache-size=4096 --address=/.wi.fi/192.168.66.1 --address=/.wifi.network/192.168.66.1 --address=/.ed.ge/192.168.66.1 --address=/.wifi/192.168.66.1 --addn-hosts=/tmp/fdsock/94de3f945d8b464496f166ecbb882993.t --dhcp-hostsfile=/tmp/fdsock/fade9dd6b6ac4b40a3136dba267b8fd5.t --servers-file=/tmp/fdsock/aeb9b099ceba42af8378b2cc3e138790.t