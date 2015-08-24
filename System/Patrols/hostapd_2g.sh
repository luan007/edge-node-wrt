#!/usr/bin/env ash

conf="/ramdisk/System/Configs/hostapd_2g.conf"
conftime=`stat -c %Y $conf`

start(){
	hostapd $conf
}

while [ $conftime -gt 0 ]
do
	modtime=`stat -c %Y $conf`
	if [ $conftime -ne $modtime ]
	then
		conftime=$modtime
		start
	fi
done
