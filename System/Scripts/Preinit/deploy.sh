#!/bin/ash

rm -rf /etc/dnsmasq.conf
rm -rf /etc/hostapd_2g.conf
rm -rf /etc/hostapd_5g.conf
rm -rf /etc/config/network.json
rm -rf /etc/config/firewall.json
rm -rf /etc/config/wifi.json
rm -rf /etc/config/dns.json
rm -rf /usr/sbin/land
rm -rf /usr/sbin/wifid
rm -rf /usr/sbin/wand
rm -rf /usr/sbin/ECI

####CONF

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
    cp /ramdisk/System/Configs/hostapd_5g.conf /etc/hostapd_5g.conf
fi

#####JSON
if [ ! -f /etc/config/network.json ]
then

    cp /ramdisk/System/Configs/network.json /etc/config/network.json
fi

if [ ! -f /etc/config/firewall.json ]
then
    cp -rf /ramdisk/System/Configs/firewall.json /etc/config/firewall.json
fi

if [ ! -f /etc/config/wifi.json ]
then
    cp -rf /ramdisk/System/Configs/wifi.json /etc/config/wifi.json
fi

if [ ! -f /etc/config/dns.json ]
then
    cp -rf /ramdisk/System/Configs/dns.json /etc/config/dns.json
fi

####ECI
if [ ! -f /usr/sbin/ECI ]
then
    cp -rf /ramdisk/System/CI/ECI /usr/sbin/ECI
    chmod 755 /usr/sbin/ECI
fi

####deamon
if [ ! -f /usr/sbin/land ]
then
    cp -rf /ramdisk/System/Scripts/Services/land /usr/sbin/land
    chmod 755 /usr/sbin/land
fi

if [ ! -f /usr/sbin/wifid ]
then
    cp -rf /ramdisk/System/Scripts/Services/wifid /usr/sbin/wifid
    chmod 755 /usr/sbin/wifid
fi

if [ ! -f /usr/sbin/wand ]
then
    cp -rf /ramdisk/System/Scripts/Services/wand /usr/sbin/wand
    chmod 755 /usr/sbin/wand
fi

###hostapd
if [ ! -d /tmp/fdsock/hostapd_aps ]
then
    mkdir -p /tmp/fdsock/hostapd_aps
fi

#sslsplit
cp -rf /ramdisk/Modules/Lua/modify.lua /tmp/modify.lua
chmod 777 /tmp/modify.lua
