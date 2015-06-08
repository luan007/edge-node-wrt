#!/bin/bash

## ramdisk
ramdisk=/staging/_Releases
first_start="$ramdisk"/first_start
## main system
system_dir="$ramdisk"/SYS
system_modules="$ramdisk"/node_modules
## pkgs
pkg_latest_file=/var/latest.zip
pkg_init_file=/var/init.zip
pkg_tmp_file=/var/tmp.zip
pkg_extracted_dir="$ramdisk"/pkg_extracted
pkg_upgrade_file="$ramdisk"/pkg_upgrade
pkg_fail_file="$ramdisk"/pkg_fail
## keys
key_path=/var/keys
app_key_file="$key_path"/App.pb
router_key_file="$key_path"/Router.pb
app_key=`cat $app_key_file`
router_key_file=`cat $router_key_file`
## passwords
password_path=/var/password
password_init_file="$password_path"/init_password
password_init=`cat $password_init_file`
password_latest_file="$password_path"/pkg_latest_password
password_upgrade_file="$ramdisk"/pkg_upgrade_password

### recover from latest or init
function recover()
{
    if [ -e "$pkg_latest_file" ] && [ -e "$password_latest_file" ]; then ## latest?
        password_latest=`cat $latest_password_file`
        openssl enc -d -aes-256-cbc -k "$password_latest" -in "$pkg_latest_file" -out "$pkg_tmp_file"
    elif [ -e "$pkg_init_file" ]; then                                  ## init.
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
    #### need upgrade
    if [ -e "$pkg_upgrade_file" ] && [ -e "$password_upgrade_file" ]; then
        pkg_path=`cat $pkg_upgrade_files`
        upgrade_password=`cat $password_upgrade_file`
        openssl enc -d -aes-256-cbc -k "$upgrade_password" -in "$pkg_path" -out "$pkg_tmp_file"

        extract ## extract tmp pkg
    fi

    #### need recovery
    if [ -e "$pkg_fail_file" ]; then
        recover ## call recover
    fi
}
## ensure pkg extracted dir
if [ ! -e "$pkg_extracted_dir" ]; then mkdir -p "$pkg_extracted_dir" ; fi

# extract pkg into ramdisk
if [ ! -e "$first_start" ]; then
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
        echo "node $system_dir/init.js" is empty
        #echo killall node...
        #killall node
        echo starting up main SYSTEM...
        node "$system_dir"/init.js
        upgrade
    fi
done