#!/bin/ash

. ./Scripts/Preinit/set_env.sh
. ./Scripts/Preinit/firewall.sh
. ./Scripts/Preinit/wireless.sh
. ./Scripts/Preinit/deploy.sh

node ./CI/ECI network set
node ./CI/ECI firewall set

node ./init.js