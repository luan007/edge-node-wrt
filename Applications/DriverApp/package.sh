#!/bin/bash

umount ./Data
rm -rf ./Data
rm -rf ../DriverApp.zip
zip -r ../DriverApp.zip ./*
