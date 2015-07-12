#!/bin/bash

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

#clean
iptables -F -t filter
iptables -X -t filter
iptables -F -t nat
iptables -X -t nat
iptables -F -t mangle
iptables -X -t mangle
ipset -F
ipset -X

#creation
iptables -N intranet_up_traffic -t filter
iptables -N intranet_down_traffic -t filter
iptables -N internet_up_traffic -t filter
iptables -N internet_down_traffic -t filter
iptables -N in_sys  -t filter
iptables -N fw_sys  -t filter
iptables -N ot_sys  -t filter
iptables -N drop_incoming -t filter
iptables -N in_custom -t filter
iptables -N fw_custom -t filter
iptables -N ot_custom -t filter
iptables -N vlan_isolation -t filter
iptables -N pre_traffic -t mangle
iptables -N post_traffic -t mangle
iptables -N pre_sys -t nat
iptables -N post_sys -t nat
iptables -N wifi_nat -t nat
iptables -N nginx_proxy -t nat
iptables -N routing_masquerade -t nat
ipset create block_remote_addresses hash:ip hashsize 4096

#rules
iptables -w -t filter -A INPUT -j in_sys
iptables -w -t filter -A INPUT -j in_custom
iptables -w -t filter -A INPUT -j drop_incoming
iptables -w -t filter -A drop_incoming -m state --state NEW -j RETURN #TODO: DROP

#vlan isolation
iptables -w -t filter -A INPUT -j vlan_isolation
iptables -w -t filter -A vlan_isolation -s 192.168.133.0/24 -i $DEV_2G -j RETURN
iptables -w -t filter -A vlan_isolation -d 192.168.133.0/24 -i $DEV_2G -j RETURN
iptables -w -t filter -A vlan_isolation -s 192.168.133.0/24 -i $DEV_5G -j RETURN
iptables -w -t filter -A vlan_isolation -d 192.168.133.0/24 -i $DEV_5G -j RETURN
iptables -w -t filter -A vlan_isolation -s 192.168.133.0/24 -i $DEV_GUEST_2G -j RETURN
iptables -w -t filter -A vlan_isolation -d 192.168.133.0/24 -i $DEV_GUEST_2G -j RETURN
iptables -w -t filter -A vlan_isolation -s 192.168.133.0/24 -i $DEV_GUEST_5G -j RETURN
iptables -w -t filter -A vlan_isolation -d 192.168.133.0/24 -i $DEV_GUEST_5G -j RETURN

iptables -w -t filter -A FORWARD -s 192.168.133.0/24 -o $DEV_WAN -j internet_up_traffic
iptables -w -t filter -A FORWARD -d 192.168.133.0/24 -i $DEV_WAN -j internet_down_traffic
iptables -w -t filter -A FORWARD -s 192.168.133.0/24 -d 192.168.133.0/24 -j intranet_up_traffic
iptables -w -t filter -A FORWARD -s 192.168.133.0/24 -d 192.168.133.0/24 -j intranet_down_traffic

iptables -w -t filter -A FORWARD -j fw_sys
iptables -w -t filter -A FORWARD -j fw_custom

#block
iptables -w -t filter -A fw_sys -i $WLAN_BR -m set --match-set block_remote_addresses dst -j REJECT

iptables -w -t filter -A OUTPUT -j ot_sys
iptables -w -t filter -A OUTPUT -j ot_custom

iptables -w -t mangle -A PREROUTING -j pre_traffic
iptables -w -t mangle -A POSTROUTING -j post_traffic

iptables -w -t nat -A PREROUTING -j nginx_proxy
iptables -w -t nat -A nginx_proxy -p tcp --dport 80 -j REDIRECT --to-ports 3378
iptables -w -t nat -A nginx_proxy -p tcp --dport 443 -j REDIRECT --to-ports 3128
iptables -w -t nat -A PREROUTING -j pre_sys
iptables -w -t nat -A pre_sys -j wifi_nat

iptables -w -t nat -A wifi_nat -i $DEV_2G -j ACCEPT
iptables -w -t nat -A wifi_nat -i $DEV_5G -j ACCEPT
iptables -w -t nat -A wifi_nat -i $DEV_GUEST_2G -j ACCEPT
iptables -w -t nat -A wifi_nat -i $DEV_GUEST_5G -j ACCEPT

iptables -w -t nat -A POSTROUTING -j post_sys
iptables -w -t nat -A POSTROUTING -j routing_masquerade
iptables -w -t nat -A routing_masquerade -j MASQUERADE -o $DEV_WAN
