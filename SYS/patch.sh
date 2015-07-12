#!/bin/ash

if [ -e /Users/emerge/projects/webstormProjects/Edge/SYS/patch.sh ]; then
    rm -rf /node_modules/sqlite3/lib/binding/node-v11-linux-arm
    mv /node_modules/sqlite3/lib/binding/node-v11-linux-ia32 /node_modules/sqlite3/lib/binding/node-v11-linux-arm
fi