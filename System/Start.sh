#!/bin/ash

. ./Preload/set_env.sh
. ./Preload/wireless.sh
. ./Preload/set_mac.sh
. ./Preload/firewall.sh

killall node
killall hostapd_cli

node ./Loader

