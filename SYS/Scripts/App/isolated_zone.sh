#!/bin/bash

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
chmod 711 -R /SagittariusA/Data/
echo chmod 500 -R ${PWD%/*}
#chmod 500 -R ${PWD%/*}
umount -l -f /SagittariusA/
mount -o remount,rw,usrquota,grpquota /
mount -o noexec,nodev,nosuid,rw,usrquota,grpquota /dev/sda1 /SagittariusA/
#mount -o noexec,nodev,nosuid,rw,usrquota,grpquota /dev/mmcblk0p1 /SagittariusA/
if [ -e /SagittariusA/aquota.group ]; then rm -rf  /SagittariusA/aquota.group ; fi
if [ -e /SagittariusA/aquota.user ]; then rm -rf /SagittariusA/aquota.user ; fi

echo QUOTACHECK.. This may take a while..
# quotacheck -ugcfm /SagittariusA/
if [ -e /SagittariusA/aquota.group ]; then echo Quota Generated! ; fi
if [ -e /SagittariusA/aquota.group ]; then echo Quota Generated! ; fi


####nginx
echo nginx operation
killall nginx >/dev/null
if [ ! -e /etc/nginx/nginx.conf ]; then cp Scripts/frontends/nginx.conf /etc/nginx/nginx.conf ; fi
if [ ! -e /opt/nginx/conf/nginx.conf ]; then cp Scripts/frontends/nginx.conf /opt/nginx/conf/nginx.conf ; fi

####users
echo mkdir User
if [ ! -e /User ]; then mkdir /User ; fi
if [ ! -e /User/FileTransfer ]; then mkdir /User/FileTransfer ; fi
chown nobody -R /User
chmod 777 /User
