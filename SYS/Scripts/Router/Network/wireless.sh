#!/bin/bash

killall hostapd

iw ap0 del
sleep 1s
iw ap1 del
sleep 1s

iw phy phy0 interface add ap0 type __ap
sleep 1s
iw phy phy1 interface add ap1 type __ap
sleep 1s

