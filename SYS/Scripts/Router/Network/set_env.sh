#!/bin/bash

#pre-set env
if [ -z $DEV_2G ]; then export DEV_2G=ap1; fi
if [ -z $DEV_5G ]; then export DEV_5G=ap0; fi
if [ -z $DEV_GUEST_2G ]; then export DEV_GUEST_2G=guest0; fi
if [ -z $DEV_GUEST_5G ]; then export DEV_GUEST_5G=guest1; fi
if [ -z $DEV_WAN ]; then export DEV_WAN=eth0; fi
if [ -z $WLAN_BR ]; then export WLAN_BR=br0; fi
#bridge