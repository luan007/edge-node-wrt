#!/bin/ash

killall nginx
killall squid
killall hostapd
killall dnsmasq
killall udhcpc
killall sslsplit

#pre-set env
if [ -z $DEV_2G ]; then export DEV_2G=ap1; fi
if [ -z $DEV_5G ]; then export DEV_5G=ap0; fi
if [ -z $DEV_GUEST_2G ]; then export DEV_GUEST_2G=guest0; fi
if [ -z $DEV_GUEST_5G ]; then export DEV_GUEST_5G=guest1; fi
if [ -z $DEV_WAN ]; then export DEV_WAN=eth2; fi
if [ -z $WLAN_BR ]; then export WLAN_BR=br0; fi
#bridge

rm -rf /tmp/fdsock
if [ ! -d /tmp/fdsock ]; then mkdir -p /tmp/fdsock; fi
chmod 755 -R /tmp/fdsock


if [ ! -d /${PWD%/*}/_data ]; then mkdir -p /${PWD%/*}/_data; fi
if [ ! -d /ramdisk/SYS/logs ]; then mkdir -p /ramdisk/SYS/logs; fi

mkdir -p /var/run/netns
rm -rf /var/run/netns/*

ln -s /proc/1/ns/net /var/run/netns/root

ifconfig VETH down
brctl delbr VETH
brctl addbr VETH

#virtual bridge
ifconfig VETH 172.16.0.1