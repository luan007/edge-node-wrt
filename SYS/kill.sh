#!/bin/bash

bashpid=`ps aux | grep "bash patrol.sh" | grep -v grep | awk '{ printf $2 }'`
echo kill bash "$bashpid"
kill "$bashpid"
nodepid=`ps aux | grep "node /ramdisk" | grep -v grep | awk '{ printf $2 }'`
echo kill node "$nodepid"
kill "$nodepid"
