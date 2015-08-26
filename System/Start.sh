#!/bin/ash

. ./Preload/set_env.sh
. ./Preload/wireless.sh
. ./Preload/set_mac.sh

#. ./Patrols/dnsmasq.sh
#. ./Patrols/hostapd_2g.sh

node ./Loader

