#!/bin/ash

. ./Preload/set_env.sh
. ./Preload/wireless.sh
. ./Preload/set_mac.sh

killall node
killall hostapd_cli

node ./Patrols/ConfigMonitor.js &

node ./Loader

