#!/bin/bash

killall hostapd

iw ap0 del
sleep 1s
iw ap1 del
sleep 1s

iw phy phy0 interface add ap0 type __ap
sleep 1s
iw phy phy1 interface add ap1 type __ap
sleep 1s

echo 1 > /proc/sys/net/ipv4/ip_forward
echo 1 > /proc/sys/net/ipv6/conf/default/forwarding
echo 1 > /proc/sys/net/ipv6/conf/all/forwarding
echo 8388608 > /proc/sys/net/core/rmem_max
echo 8388608 > /proc/sys/net/core/wmem_max
echo 1 > /proc/sys/net/ipv4/tcp_timestamps

echo 1 > /proc/sys/net/ipv4/tcp_fack
echo 1 > /proc/sys/net/ipv4/tcp_sack

echo '8192 4194304 8388608' > /proc/sys/net/ipv4/tcp_wmem
echo '4096 2097152 8388608' > /proc/sys/net/ipv4/tcp_rmem
