#!/bin/bash

while true
do
    process=`ps aux | grep "node init.js" | grep -v grep`
    if [ "$process" == "" ]; then
        echo killall node...
        killall node
        echo starting up main SYSTEM...
        node init.js
    fi

    if [ -e /var/pkg_upgrade ]; then
        pkg_path=`cat /var/pkg_upgrade`
        echo copying node_modules...
        cp -rf "$pkg_path"/node_modules /node_modules
        echo copying main SYSTEM...
        cp -rf "$pkg_path"/SYS /SYS
    fi

    if [ -e /var/pkg_fail ]; then
        if [ ! -e /var/pkg_tmp/recovery ]; then
            mkdir -p /var/pkg_tmp/recovery
        fi

        if [ -e /var/latest.zip ]; then
            unzip -o -d /var/pkg_tmp/recovery /var/latest.zip
        elif [ -e /var/init.zip ]; then
            unzip -o -d /var/pkg_tmp/recovery /var/init.zip
        fi

        cp -rf /var/pkg_tmp/recovery/node_modules /node_modules
        cp -rf /var/pkg_tmp/recovery/SYS /SYS
    fi

    sleep 2s;
done

