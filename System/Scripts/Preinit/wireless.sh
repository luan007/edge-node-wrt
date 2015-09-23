#!/bin/ash

#rfkill unblock wlan

iw ap0 del
iw ap1 del
iw guset0 del
iw guset1 del
sleep 1

iw phy phy0 interface add ap0 type __ap
iw phy phy1 interface add ap1 type __ap
iw phy phy0 interface add guset0 type __ap
iw phy phy1 interface add guset1 type __ap

#bridge
ifconfig $WLAN_BR down
brctl delbr $WLAN_BR
brctl addbr $WLAN_BR
ifconfig $WLAN_BR up
echo "0" > /sys/devices/virtual/net/$WLAN_BR/bridge/multicast_snooping
# TODO: relay & scan
#iw phy phy0 interface add test0 type managed
#fconfig test0 up

ifconfig ap0 hw ether 00:16:3e:01:00:03
ifconfig ap1 hw ether 00:16:3e:01:00:04