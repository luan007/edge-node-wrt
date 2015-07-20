echo 1 > /etc/mitmrunning
cp -rf /ramdisk/Modules/Lua/modify.lua /tmp/modify.lua
chmod 777 /tmp/modify.lua
while [ ! -f "/etc/mitmstop" ]
do
	echo ----------SSLSPLIT RUNNING-----------
	sslsplit -M /tmp/modify.lua -k /ramdisk/SYS/Scripts/Frontend/certs/cert.key -c /ramdisk/SYS/Scripts/Frontend/certs/cert.crt https 0.0.0.0 3128 http 0.0.0.0 3378
done
rm -rf /etc/mitmrunning