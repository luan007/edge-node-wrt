#!/usr/bin/env bash

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

if [ ! -d /tmp/fdsock/hostapd_aps ]
then
    mkdir -p /tmp/fdsock/hostapd_aps
fi