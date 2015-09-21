#!/usr/bin/env bash

sig=$1
cmd="dnsmasq"

pid()
{
    retval=-1
    #return `cat /var/run/dnsmasq.pid`
    psi=$(ps ax | grep "$cmd" | grep -v grep)
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