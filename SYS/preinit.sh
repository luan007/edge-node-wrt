#!/bin/ash

. ./patch.sh

chmod +x Scripts/Network/traffic.sh

. Scripts/Network/set_env.sh

. Scripts/Network/firewall.sh

#sleep 1

. Scripts/Network/wireless.sh

. Scripts/App/isolated_zone.sh

. Scripts/Frontend/init_nginx.sh

. Scripts/Network/set_mac.sh
