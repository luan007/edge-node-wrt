#!/bin/ash

. ./preinit.sh

node ./CI/ECI network set
node ./CI/ECI firewall set

#DEBUG=1

product(){
    local ramdisk=/ramdisk
    local init_file="$ramdisk"/System/init.js

    while true
    do
        echo init..
        process=`ps aux | grep "node $init_file" | grep -v grep`
        if [ "$process" == "" ]; then
            node "$init_file"
        fi
    done
}
debug(){
    node ./init.js
}

if [ ! $DEBUG ];
then
    product
else
    debug
fi