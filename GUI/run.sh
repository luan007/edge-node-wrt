#!/bin/ash

killall X
killall electron
export DISPLAY=:0
X -nocursor -s 0 -extension "DPMS" &
cd /opt/electron
./electron /ramdisk/GUI
