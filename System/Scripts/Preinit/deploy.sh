#!/bin/ash

rm -rf /etc/dnsmasq.conf
rm -rf /etc/hostapd_2g.conf
rm -rf /etc/hostapd_5g.conf
rm -rf /etc/network.json
rm -rf /etc/firewall.json

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

if [ ! -f /etc/network.json ]
then

    cp /ramdisk/System/Configs/network.json /etc/network.json
fi

if [ ! -f /etc/firewall.json ]
then
    cp -rf /ramdisk/System/Configs/firewall.json /etc/firewall.json
fi


if [ ! -d /tmp/fdsock/hostapd_aps ]
then
    mkdir -p /tmp/fdsock/hostapd_aps
fi

#sslsplit
cp -rf /ramdisk/Modules/Lua/modify.lua /tmp/modify.lua
chmod 777 /tmp/modify.lua
