#!/bin/ash

. ./patch.sh

chmod +x Scripts/Router/Network/traffic.sh

. Scripts/Router/Network/set_env.sh

. Scripts/Router/Network/firewall.sh

sleep 1

. Scripts/Router/Network/wireless.sh

. Scripts/App/isolated_zone.sh

. Scripts/Router/Network/set_mac.sh

if [ ! -f /etc/mitmrunning ]
then
	. Scripts/Router/Network/mitm.sh &
fi
