#!/bin/ash

#rfkill unblock wlan
killall hostapd

iw ap0 del
sleep 1
iw ap1 del
sleep 1

iw phy phy0 interface add ap0 type __ap
sleep 1
iw phy phy1 interface add ap1 type __ap
sleep 1

iw guset0 del
sleep 1
iw guset1 del
sleep 1

iw phy phy0 interface add guset0 type __ap
sleep 1
iw phy phy1 interface add guset1 type __ap
sleep 1

#bridge
ifconfig $WLAN_BR down
brctl delbr $WLAN_BR
brctl addbr $WLAN_BR
ifconfig $WLAN_BR up
echo "0" > /sys/devices/virtual/net/$WLAN_BR/bridge/multicast_snooping
# TODO: relay & scan
#iw phy phy0 interface add test0 type managed
#fconfig test0 up
