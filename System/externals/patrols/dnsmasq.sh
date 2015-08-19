#!/usr/bin/env ash

conf="/ramdisk/System/externals/configs/dnsmasq.conf"
conftime=`stat -c %Y $conf`

start(){
	args=`cat $conf | awk '{printf "%s ", $0}'`
	killall dnsmasq
	dnsmasq $args
}

start
while [ $conftime -gt 0 ]
do
	modtime=`stat -c %Y $conf`
	if [ $conftime -ne $modtime ]
	then
		conftime=$modtime
		start
	fi
done