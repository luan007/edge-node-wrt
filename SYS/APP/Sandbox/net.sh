#!/bin/ash
#PARAM 2: ip

rm -rf /var/run/netns/$1
ln -s /proc/$1/ns/net /var/run/netns/$1
ip netns exec root /sbin/ip link add host_$1 type veth peer name app_$1
ip netns exec root /sbin/ip link set app_$1 netns $1
ip netns exec root /sbin/ip link set host_$1 up


###low priviledge
ifconfig app_$1 $2
ip link set lo up
ip link set app_$1 up
ip route add default via 172.16.0.1 dev app_$1
