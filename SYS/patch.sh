#!/bin/ash

ln -s /dev/mmcblk0p1 /dev/root
chmod 777 APP/Sandbox/net.sh
#chmod -R 644 /ramdisk/Modules/Static
if [ -e /node_modules/sqlite3/lib/binding/node-v11-linux-ia32  ]; then
    #rm -rf /node_modules/sqlite3/lib/binding/node-v11-linux-arm
    mv /node_modules/sqlite3/lib/binding/node-v11-linux-ia32 /node_modules/sqlite3/lib/binding/node-v11-linux-arm
fi
chmod 755 /ramdisk
chmod 755 -R /ramdisk/Modules/*