#!/bin/ash

if [ -z $1 ]; then
        echo please enter a version e.g. 1.0.0
else
    cd /ramdisk/
    rm -rf ./Packages/*.zip
    echo packaging "$1".zip ...
    zip -r ./Packages/"$1".zip /node_modules
    zip -r ./Packages/"$1".zip ./SYS
    zip -r ./Packages/"$1".zip ./Modules
fi
