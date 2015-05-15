#!/bin/bash

rfkill unblock wlan
killall hostapd

iw ap0 del
sleep 1s
iw ap1 del
sleep 1s

iw phy phy0 interface add ap0 type __ap
sleep 1s
iw phy phy1 interface add ap1 type __ap
sleep 1s

#bridge
ifconfig $WLAN_BR down
brctl delbr $WLAN_BR
brctl addbr $WLAN_BR
ifconfig $WLAN_BR up

# TODO: relay & scan
#iw phy phy0 interface add test0 type managed
#fconfig test0 up
