#!/usr/bin/env ash

if [ ! -d /tmp/fdsock ]; then mkdir -p /tmp/fdsock; fi
chmod 755 -R /tmp/fdsock

chmod 755 /ramdisk/System/Patrols/dnsmasq.js
chmod 755 /ramdisk/System/Patrols/hostapd.js

#chomd 755 /ramdisk/System/Configs/Scripts/dnsmasq_send.sh

