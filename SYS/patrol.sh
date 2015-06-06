#!/bin/bash

## ramdisk
ramdisk=/ramdisk
first_start="$ramdisk"/first_start
## main system
system_dir="$ramdisk"/SYS
system_modules="$ramdisk"/node_modules
## pkgs
latest_pkg_file=/var/latest.zip
init_pkg_file=/var/init.zip
tmp_pkg_file=/var/tmp.zip
pkg_extracted_dir="$$ramdisk"/pkg_extracted
## keys
key_path=/var/keys
app_key_file="$key_path"/App.pb
router_key_file="$key_path"/Router.pb
app_key=`cat $app_key_file`
router_key_file=`cat $router_key_file`
## passwords
password_path=/var/password
init_password_file="$password_path"/init_password
init_password=`cat $init_password_file`
latest_password_file="$password_path"/pkg_password

## ensure pkg extracted dir
if [ ! -e "$pkg_extracted_dir" ]; then mkdir -p "$pkg_extracted_dir" fi

# extract pkg into ramdisk
if [ ! -e "$first_start" ]; then
    if [ -e "$latest_pkg_file" ] && [ -e "$latest_password_file" ]; then ## latest?
        latest_password=`cat $latest_password_file`
        openssl enc -d -aes-256-cbc -k "$latest_password" -in "$latest_pkg_file" -out "$tmp_pkg_file"
    elif [ -e "$init_pkg_file" ]; then                                  ## init.
        openssl enc -d -aes-256-cbc -k "$init_password" -in "$init_pkg_file" -out "$tmp_pkg_file"
    else                                                                 ## machine has been damaged!!!
        exit 1
    fi

    echo extracting PKG...
    unzip -o -d "$tmp_pkg_file" "$pkg_extracted_dir"  ## unzip...
    touch "$first_start"
fi

while true
do
    process=`ps aux | grep "node init.js" | grep -v grep`
    if [ "$process" == "" ]; then
        echo killall node...
        killall node
        echo starting up main SYSTEM...
        node init.js
    fi

    ####  need upgrade
    if [ -e /var/pkg_upgrade ]; then
        pkg_path=`cat /var/pkg_upgrade`
        echo copying node_modules...
        cp -rf "$pkg_path"/node_modules /node_modules
        echo copying main SYSTEM...
        cp -rf "$pkg_path"/SYS /SYS
    fi

    #### need recovery
    if [ -e /var/pkg_fail ]; then
        if [ ! -e /var/pkg_tmp/recovery ]; then
            echo mkdir /var/pkg_tmp/recovery...
            mkdir -p /var/pkg_tmp/recovery
        fi

        if [ -e /var/latest.zip ]; then
            echo unzip latest.zip /var/pkg_tmp/recovery...
            unzip -o -d /var/pkg_tmp/recovery /var/latest.zip
        elif [ -e /var/init.zip ]; then
            echo unzip init.zip /var/pkg_tmp/recovery...
            unzip -o -d /var/pkg_tmp/recovery /var/init.zip
        fi

        echo copying node_modules...
        cp -rf /var/pkg_tmp/recovery/node_modules "$system_modules"
        echo copying main SYSTEM...
        cp -rf /var/pkg_tmp/recovery/SYS "$system_dir"
    fi

    sleep 2s;
done

