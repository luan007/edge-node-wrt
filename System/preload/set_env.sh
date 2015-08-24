#!/usr/bin/env ash

if [ ! -d /tmp/fdsock ]; then mkdir -p /tmp/fdsock; fi
chmod 755 -R /tmp/fdsock

chomd 755 /ramdisk/System/externals/scripts/dnsmasq_send.sh

