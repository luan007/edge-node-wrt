#!/usr/bin/env bash

band=$1
sig=$2
cmd="hostapd"
conf="/etc/hostapd_"$band".conf"

pid()
{
    retval=-1
    #return `cat /var/run/dnsmasq.pid`
    psi=$(ps ax | grep "$cmd $conf" | grep -v grep)
    if [ -n "$psi" ]; then
        retval=$(echo "$psi" | sed -n 1p | awk '{print $1}')
    fi
    echo $retval
}

spawn()
{
    ret=$(pid)
    if [ "$ret" == -1 ]; then
        `$cmd`
    else
        kill -s "$sig" "$ret"
    fi
}

spawn
