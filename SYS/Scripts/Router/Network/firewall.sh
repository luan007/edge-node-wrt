#!/bin/bash

#clean
iptables -F -t filter
iptables -X -t filter
iptables -F -t nat
iptables -X -t nat
iptables -F -t mangle
iptables -X -t mangle

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

#rules
iptables -w -t filter -A INPUT -j in_sys
iptables -w -t filter -A INPUT -j in_custom
iptables -w -t filter -A INPUT -m state --state NEW -j DROP #ACCEPT?

iptables -w -t filter -A FORWARD -j fw_sys
iptables -w -t filter -A FORWARD -j fw_custom

iptables -w -t filter -A OUTPUT -j ot_sys
iptables -w -t filter -A OUTPUT -j ot_custom

iptables -w -t mangle -A PREROUTING -j pre_traffic
iptables -w -t mangle -A POSTROUTING -j post_traffic

iptables -w -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3378
iptables -w -t nat -A PREROUTING -j pre_sys

iptables -w -t nat -A POSTROUTING -j post_sys
iptables -w -t nat -A POSTROUTING -j MASQUERADE