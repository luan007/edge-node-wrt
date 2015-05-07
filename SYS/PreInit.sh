#!/bin/bash

chmod +x Scripts/Router/Network/traffic.sh

. Scripts/Router/Network/set_env.sh

. Scripts/Router/Network/firewall.sh
sleep 1s
. Scripts/Router/Network/wireless.sh