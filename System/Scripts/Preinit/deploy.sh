#!/bin/ash

rm -rf /etc/dnsmasq.conf
rm -rf /etc/hostapd_2g.conf
rm -rf /etc/hostapd_5g.conf
rm -rf /etc/config/network.json
rm -rf /etc/config/firewall.json
rm -rf /etc/init.d/networkd
rm -rf /etc/init.d/wland
rm -rf /etc/init.d/wand

if [ ! -f /etc/dnsmasq.conf ]
then

    cp /ramdisk/System/Configs/dnsmasq.conf /etc/dnsmasq.conf
fi

if [ ! -f /etc/hostapd_2g.conf ]
then

    cp /ramdisk/System/Configs/hostapd_2g.conf /etc/hostapd_2g.conf
fi

if [ ! -f /etc/hostapd_5g.conf ]
then
    rm -rf /etc/hostapd_5g.conf
    cp /ramdisk/System/Configs/hostapd_5g.conf /etc/hostapd_5g.conf
fi

if [ ! -f /etc/config/network.json ]
then

    cp /ramdisk/System/Configs/network.json /etc/config/network.json
fi

if [ ! -f /etc/config/firewall.json ]
then
    cp -rf /ramdisk/System/Configs/firewall.json /etc/config/firewall.json
fi

####deamon
if [ ! -f /etc/init.d/land ]
then
    cp -rf /ramdisk/System/Scripts/Services/land /etc/init.d/land
fi

if [ ! -f /etc/init.d/wifid ]
then
    cp -rf /ramdisk/System/Scripts/Services/wifid /etc/init.d/wifid
fi

if [ ! -f /etc/init.d/wand ]
then
    cp -rf /ramdisk/System/Scripts/Services/wand /etc/init.d/wand
fi

####daemon end

if [ ! -d /tmp/fdsock/hostapd_aps ]
then
    mkdir -p /tmp/fdsock/hostapd_aps
fi

#sslsplit
cp -rf /ramdisk/Modules/Lua/modify.lua /tmp/modify.lua
chmod 777 /tmp/modify.lua
