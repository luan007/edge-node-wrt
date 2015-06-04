#!/bin/bash

while true
do
    process=`ps aux | grep "node init.js" | grep -v grep`
    if [ "$process" == "" ]; then
        killall node
        node init.js
    fi

    if [ -e /var/pkg_upgrade ]; then
        pkg_path=`cat /var/pkg_upgrade`
        cp -rf "$pkg_path"/node_modules /node_modules
        cp -rf "$pkg_path"/SYS /SYS
    fi
    sleep 2s;
done

