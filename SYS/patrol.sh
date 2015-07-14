#!/bin/ash

## storage
storage=/storage
password_dir="$storage"/passwords
password_init_file="$password_dir"/init.password
password_latest_file="$password_dir"/pkg_latest_password
pkg_latest_file="$storage"/latest.zip
pkg_init_file="$storage"/init.zip
## keys
key_dir="$storage"/keys
app_key_file="$key_dir"/App.pr
router_key_file="$key_dir"/Router.pb

## ramdisk
ramdisk=/ramdisk
first_start="$ramdisk"/first_start
## main system
system_dir="$ramdisk"/SYS
system_modules="$ramdisk"/node_modules
## pkgs
pkg_extracted_dir="$ramdisk"/pkg_extracted
pkg_upgrade_file="$ramdisk"/pkg_upgrade
pkg_fail_file="$ramdisk"/pkg_fail
pkg_tmp_file="$ramdisk"/pkg_tmp/tmp.zip
## passwords
password_upgrade_file="$ramdisk"/pkg_upgrade_password

### recover from latest or init
recover()
{
    if [ -f "$pkg_latest_file" ] && [ -f "$password_latest_file" ]; then ## latest?
        echo recovering from latest zip...
        password_latest=`openssl rsautl -decrypt -inkey "$app_key_file" -in "$password_latest_file"`
        openssl enc -d -aes-256-cbc -pass pass:"$password_latest" -in "$pkg_latest_file" -out "$pkg_tmp_file"
        rm "$pkg_fail_file"
        extract
    elif [ -f "$pkg_init_file" ]; then                                  ## init.
        echo recovering from init zip...
        password_init=`openssl rsautl -decrypt -inkey "$app_key_file" -in "$password_init_file"`
        openssl enc -d -aes-256-cbc -pass pass:"$password_init" -in "$pkg_init_file" -out "$pkg_tmp_file"
        rm "$pkg_fail_file"
        extract
    else                                                               ## machine has been damaged!!!
        echo machine has been damaged!!!
        exit 1
    fi
}

extract()
{
    echo extracting PKG...
    unzip -o -d "$pkg_extracted_dir" "$pkg_tmp_file" ## unzip...
    echo cp -rf "$pkg_extracted_dir"/SYS "$system_dir"/../
    cp -rf "$pkg_extracted_dir"/SYS "$system_dir"/../
    echo cp -rf "$pkg_extracted_dir"/Modules "$system_dir"/../
    cp -rf "$pkg_extracted_dir"/Modules "$system_dir"/../
    echo cp -rf "$pkg_extracted_dir"/node_modules "$system_dir"/
    cp -rf "$pkg_extracted_dir"/node_modules "$system_dir"/
    rm -rf "$pkg_extracted_dir"
}

upgrade()
{
    echo entering upgrade flow.
    #### need upgrade
    if [ -f "$pkg_upgrade_file" ] && [ -f "$password_upgrade_file" ]
    then
        pkg_path=`cat "$pkg_upgrade_file"`
        password_upgrade=`openssl rsautl -decrypt -inkey "$app_key_file" -in "$password_upgrade_file"`
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
    while killall node
    do
        echo killing node
    done

    ### monitoring
    process=`ps aux | grep "node $system_dir/Init.js" | grep -v grep`
    if [ "$process" == "" ]; then
        echo init...
        . ./preinit.sh
        #echo killall node...
        #killall node
        echo wan dev is $DEV_WAN

        echo starting up main SYSTEM...
        node "$system_dir"/Init.js
        upgrade
    fi

    sleep 2;
done