#!/usr/bin/env ash

conf="/ramdisk/System/externals/configs/hostapd.conf"
conftime=`stat -c %Y $conf`

start(){
	killall hostapd
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
