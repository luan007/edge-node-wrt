#!/bin/ash

. ./Scripts/Preinit/deploy.sh
. ./Scripts/Preinit/set_env.sh
. ./Scripts/Preinit/firewall.sh
. ./Scripts/Preinit/wireless.sh

node ./CI/ECI network set
node ./CI/ECI firewall set

node ./init.js