#!/bin/bash

## ramdisk
ramdisk=/ramdisk
first_start="$ramdisk"/first_start
## main system
system_dir="$ramdisk"/SYS
system_modules="$ramdisk"/node_modules
## pkgs
pkg_latest_file="$ramdisk"/latest.zip
pkg_init_file="$ramdisk"/init.zip
pkg_tmp_file="$ramdisk"/tmp.zip
pkg_extracted_dir="$ramdisk"/pkg_extracted
pkg_upgrade_file="$ramdisk"/pkg_upgrade
pkg_fail_file="$ramdisk"/pkg_fail
## keys
key_path="$ramdisk"/keys
app_key_file="$key_path"/App.pb
router_key_file="$key_path"/Router.pb
app_key=`cat "$app_key_file"`
router_key_file=`cat "$router_key_file"`
## passwords
password_path=/var/password
password_init_file="$password_path"/init_password
password_init=`cat "$password_init_file"`
password_latest_file="$password_path"/pkg_latest_password
password_upgrade_file="$ramdisk"/pkg_upgrade_password

### recover from latest or init
function recover()
{
    if [ -f "$pkg_latest_file" ] && [ -f "$password_latest_file" ]; then ## latest?
        password_latest=`cat "$latest_password_file"`
        openssl enc -d -aes-256-cbc -k "$password_latest" -in "$pkg_latest_file" -out "$pkg_tmp_file"
    elif [ -f "$pkg_init_file" ]; then                                  ## init.
        openssl enc -d -aes-256-cbc -k "$password_init" -in "$pkg_init_file" -out "$pkg_tmp_file"
    else                                                                 ## machine has been damaged!!!
        exit 1
    fi
}

function extract()
{
    echo extracting PKG...
    unzip -o -d "$pkg_tmp_file" "$pkg_extracted_dir"  ## unzip...
    echo copying into ramdisk
    mv -f "$pkg_extracted_dir"/SYS "$system_dir"
    mv -f "$pkg_extracted_dir"/node_modules "$system_modules"
}

function upgrade()
{
    echo entering upgrade flow.
    #### need upgrade
    if [ -f "$pkg_upgrade_file" ] && [ -f "$password_upgrade_file" ]
    then
        echo holy shit "$pkg_upgrade_file"
        pkg_path=`cat "$pkg_upgrade_file"`
        echo openssl enc -d -aes-256-cbc -kfile "$password_upgrade_file" -in "$pkg_path" -out "$pkg_tmp_file"
        openssl enc -d -aes-256-cbc -kfile "$password_upgrade_file" -in "$pkg_path" -out "$pkg_tmp_file"

        extract ## extract tmp pkg
    fi

    echo does not exist....

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