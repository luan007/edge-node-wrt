#!/bin/bash

rm -rf ./Data/OUIDB
umount /SagittariusA/Data/App/DriverApp/
rm -rf ../DriverApp.zip
zip -r ../DriverApp.zip ./*
