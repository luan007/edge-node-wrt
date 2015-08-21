#!/usr/bin/env ash

. ./preload/set_env.sh
. ./preload/wireless.sh
. ./preload/set_mac.sh

node ./loader.js
