#!/bin/bash

## ramdisk
ramdisk=/ramdisk
first_start="$ramdisk"/first_start
## main system
system_dir="$ramdisk"/SYS
system_modules=/node_modules
## pkgs
pkg_latest_file="$ramdisk"/latest.zip
pkg_init_file="$ramdisk"/init.zip
pkg_extracted_dir="$ramdisk"/pkg_extracted
pkg_upgrade_file="$ramdisk"/pkg_upgrade
pkg_fail_file="$ramdisk"/pkg_fail
pkg_tmp_file="$ramdisk"/pkg_tmp/tmp.zip
## keys
key_dir="$ramdisk"/keys
app_key_file="$key_dir"/App.pb
router_key_file="$key_dir"/Router.pb
app_key=`cat "$app_key_file"`
router_key_file=`cat "$router_key_file"`
## passwords
password_dir="$ramdisk"/passwords
password_init_file="$password_dir"/init_password
password_init=`cat "$password_init_file"`
password_latest_file="$password_dir"/pkg_latest_password
password_upgrade_file="$ramdisk"/pkg_upgrade_password

### recover from latest or init
function recover()
{
    if [ -f "$pkg_latest_file" ] && [ -f "$password_latest_file" ]; then ## latest?
        echo recovering from latest zip...
        password_latest=`cat "$password_latest_file"`
        openssl enc -d -aes-256-cbc -pass pass:"$password_latest" -in "$pkg_latest_file" -out "$pkg_tmp_file"
        rm "$pkg_fail_file"
        extract
    elif [ -f "$pkg_init_file" ]; then                                  ## init.
        echo recovering from init zip...
        openssl enc -d -aes-256-cbc -pass pass:"$password_init" -in "$pkg_init_file" -out "$pkg_tmp_file"
        rm "$pkg_fail_file"
        extract
    else                                                               ## machine has been damaged!!!
        echo machine has been damaged!!!
        exit 1
    fi
}

function extract()
{
    echo extracting PKG...
    unzip -o -d "$pkg_extracted_dir" "$pkg_tmp_file" ## unzip...
    echo cp -rf "$pkg_extracted_dir"/SYS "$system_dir"/../
    cp -rf "$pkg_extracted_dir"/SYS "$system_dir"/../
    echo cp -rf "$pkg_extracted_dir"/node_modules "$system_modules"/../
    cp -rf "$pkg_extracted_dir"/node_modules "$system_modules"/../
    rm -rf "$pkg_extracted_dir"
}

function upgrade()
{
    echo entering upgrade flow.
    #### need upgrade
    if [ -f "$pkg_upgrade_file" ] && [ -f "$password_upgrade_file" ]
    then
        pkg_path=`cat "$pkg_upgrade_file"`
        password_upgrade=`cat "$password_upgrade_file"`
        echo pkg_path ===  "$pkg_path"
        echo openssl enc -d -aes-256-cbc -pass pass:"$password_upgrade" -in "$pkg_path" -out "$pkg_tmp_file"
        openssl enc -d -aes-256-cbc -pass pass:"$password_upgrade" -in "$pkg_path" -out "$pkg_tmp_file"

        extract ## extract tmp pkg
    fi

    #### need recovery
    if [ -f "$pkg_fail_file" ]; then
        recover ## call recover
    fi
}
## ensure pkg extracted dir
if [ ! -f "$pkg_extracted_dir" ]; then mkdir -p "$pkg_extracted_dir" ; fi

# extract pkg into ramdisk
if [ ! -f "$first_start" ]; then
    recover ## call recover

    extract ## extract tmp pkg

    touch "$first_start"
fi

### main loop
while true
do
    ### monitoring
    process=`ps aux | grep "node $system_dir/init.js" | grep -v grep`
    if [ "$process" == "" ]; then
        echo init...
        bash ./preinit.sh
        #echo killall node...
        #killall node
        echo starting up main SYSTEM...
        node "$system_dir"/init.js
        upgrade
    fi

    sleep 2s;
done