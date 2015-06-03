#!/bin/bash

while true
do
    process=`ps aux | grep "node init.js" | grep -v grep`
    if [ "$process" == "" ]; then
        killall node
        node init.js
    fi
    sleep 2s;
done
