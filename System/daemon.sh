#!/bin/ash

while true; do
    ##WAN
    WAN=$(ECI network get wan scheme)
    WAN_PID=$(wand $WAN status)
    if [ -z "$WAN_PID" ]; then
        wand $WAN restart
    fi

    ##HOSTAPD


    ##DNSMASQ

    sleep 2s
done
