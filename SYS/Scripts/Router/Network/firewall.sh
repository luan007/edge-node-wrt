#!/bin/bash

#pre-set env
if [ -z $DEV_2G ]; then export DEV_2G=ap1; fi
if [ -z $DEV_5G ]; then export DEV_5G=ap0; fi
if [ -z $DEV_GUEST_2G ]; then export DEV_GUEST_2G=guest0; fi
if [ -z $DEV_GUEST_5G ]; then export DEV_GUEST_5G=guest1; fi

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
iptables -N in_sys  -t filter
iptables -N fw_sys  -t filter
iptables -N ot_sys  -t filter
iptables -N pre_sys -t nat
iptables -N post_sys -t nat
iptables -N pre_traffic -t mangle
iptables -N post_traffic -t mangle
iptables -N in_custom -t filter
iptables -N fw_custom -t filter
iptables -N ot_custom -t filter
iptables -N wifi_nat -t nat
iptables -N vlan_isolation -t filter
iptables -N nginx_proxy -t nat
ipset -N block_remote_addresses iphash

#rules
iptables -w -t filter -A INPUT -j in_sys
iptables -w -t filter -A INPUT -j in_custom
iptables -w -t filter -A INPUT -m state --state NEW -j ACCEPT #TODO: DROP

iptables -w -t filter -A FORWARD -j fw_sys
iptables -w -t filter -A FORWARD -j fw_custom

iptables -w -t filter -A OUTPUT -j ot_sys
iptables -w -t filter -A OUTPUT -j ot_custom

#block
iptables -w -t filter -A ot_sys -m set --match-set block_remote_addresses dst -j REJECT

#vlan isolation
iptables -w -t filter -A INPUT -j vlan_isolation
iptables -w -t filter -A vlan_isolation -s 192.168.33.1/24 -i $DEV_2G -j RETURN
iptables -w -t filter -A vlan_isolation -d 192.168.33.1/24 -i $DEV_2G -j RETURN
iptables -w -t filter -A vlan_isolation -s 192.168.33.1/24 -i $DEV_5G -j RETURN
iptables -w -t filter -A vlan_isolation -d 192.168.33.1/24 -i $DEV_5G -j RETURN
iptables -w -t filter -A vlan_isolation -s 192.168.33.1/24 -i $DEV_GUEST_2G -j RETURN
iptables -w -t filter -A vlan_isolation -d 192.168.33.1/24 -i $DEV_GUEST_2G -j RETURN
iptables -w -t filter -A vlan_isolation -s 192.168.33.1/24 -i $DEV_GUEST_5G -j RETURN
iptables -w -t filter -A vlan_isolation -d 192.168.33.1/24 -i $DEV_GUEST_5G -j RETURN

iptables -w -t mangle -A PREROUTING -j pre_traffic
iptables -w -t mangle -A POSTROUTING -j post_traffic

iptables -w -t nat -A PREROUTING -j nginx_proxy
iptables -w -t nat -A nginx_proxy -p tcp --dport 80 -j REDIRECT --to-ports 3378
iptables -w -t nat -A PREROUTING -j pre_sys
iptables -w -t nat -A pre_sys -j wifi_nat
#TODO: process.env.DEV_2G process.env.DEV_5G
#iptables -w -t nat -R wifi_nat 1 -i ap0 -j DROP
#iptables -w -t nat -R wifi_nat 2 -i ap1 -j DROP
#geuest APs are: $DEV_GUEST_2G $DEV_GUEST_5G
iptables -w -t nat -A wifi_nat -i $DEV_2G -j RETURN
iptables -w -t nat -A wifi_nat -i $DEV_5G -j RETURN
iptables -w -t nat -A wifi_nat -i $DEV_GUEST_2G -j RETURN
iptables -w -t nat -A wifi_nat -i $DEV_GUEST_5G -j RETURN

iptables -w -t nat -A POSTROUTING -j post_sys
iptables -w -t nat -A POSTROUTING -j MASQUERADE