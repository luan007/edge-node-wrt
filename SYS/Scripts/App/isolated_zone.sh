#!/bin/ash

echo Check if the folder exists..

if [ ! -d /SagittariusA/ ]; then mkdir -p /SagittariusA/ ; fi
if [ ! -d /SagittariusA/Data/ ]; then mkdir -p /SagittariusA/Data/ ; fi
if [ ! -d /SagittariusA/Data/App/ ]; then mkdir -p /SagittariusA/Data/App/ ; fi

#TODO:enable
#ln /dev/mmcblk0p1 /dev/root
quotaoff -a
#chmod 005 /
#chmod 005 /bin
#chmod 005 /usr
chown root -R /SagittariusA/Data/
#TODO:WARNING UNSECURE
chmod 755 -R /SagittariusA/Data/
echo chmod 500 -R ${PWD%/*}
#chmod 500 -R ${PWD%/*}
umount -l -f /SagittariusA/
mount -o remount,rw,usrquota,grpquota /
#mount -o noexec,nodev,nosuid,rw,usrquota,grpquota /dev/sda1 /SagittariusA/
mount -o noexec,nodev,nosuid,rw,usrquota,grpquota /dev/mmcblk0p1 /SagittariusA/

if [ ! -e /SagittariusA/aquota.group ]
then 

	echo QUOTACHECK.. This may take a while..
	quotacheck -ugcfm /SagittariusA/
	if [ -e /SagittariusA/aquota.group ]; then echo Quota Generated! ; fi

fi

#if [ -e /SagittariusA/aquota.group ]; then rm -rf  /SagittariusA/aquota.group ; fi
#if [ -e /SagittariusA/aquota.user ]; then rm -rf /SagittariusA/aquota.user ; fi


####users
echo mkdir User
if [ ! -e /User ]; then mkdir /User ; fi
if [ ! -e /User/FileTransfer ]; then mkdir /User/FileTransfer ; fi
chown nobody -R /User
chmod 777 /User

####apps
echo mkdir /storage/Apps
if [ ! -e /storage/Apps ]; then mkdir /storage/Apps ; fi

echo mkdir /ramdisk/app_tmp
if [ ! -e /ramdisk/app_tmp ]; then mkdir /ramdisk/app_tmp ; fi
rm -rf /ramdisk/app_tmp/*

####pkgs
echo mkdir /ramdisk/pkg_tmp
if [ ! -e /ramdisk/pkg_tmp ]; then mkdir /ramdisk/pkg_tmp ; fi
##rm -rf /ramdisk/pkg_tmp/*

####keys
echo copying keys
if [ ! -e /storage/Keys ]; then mkdir /storage/Keys ; fi
cp -rf /ramdisk/SYS/Common/Crypto/Keys/*.pb /storage/Keys
cp -rf /ramdisk/SYS/Common/Crypto/Keys/*.pr /storage/Keys

####passwords
echo init passwords
if [ ! -e /ramdisk/passwords ]; then mkdir /ramdisk/passwords ; fi
cp -rf /ramdisk/SYS/Common/Crypto/Keys/init.password /ramdisk/passwords/init.password

####resource
rm -rf /storage/Resource/Streaming/
mkdir -p /storage/Resource/Assets/
mkdir -p /storage/Resource/Streaming/
mkdir -p /storage/Resource/Streaming/Airplay