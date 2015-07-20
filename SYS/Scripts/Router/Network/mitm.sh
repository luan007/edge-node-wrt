echo 1 > /etc/mitmrunning
while [ ! -f "/etc/mitmstop" ]
do
	echo ----------SSLSPLIT RUNNING-----------
	sslsplit -M /ramdisk/Modules/Lua/modify.lua -k /ramdisk/SYS/Scripts/frontends/certs/cert.key -c /ramdisk/SYS/Scripts/frontends/certs/cert.crt https 0.0.0.0 3128 http 0.0.0.0 3378
done
rm -rf /etc/mitmrunning