#!/bin/bash

echo '{ "ap1": {'

t=$(iw ap1 station dump)
if [ ! -z "$t" ]
then
	echo "$t" | awk '{if ($1 ~ /^Station/) { 
			printf "},\"%s\":{",$2
		}
		else{
			gsub(/ /,"_",$0);gsub(/[ \t\/]|dBm|ms/,"",$0); split($0,a,":"); gsub("_","",a[2]); printf "\"%s\":%s,",a[1],a[2]
		}
	}'
	echo '}'
fi

echo '}  ,"ap0": {'

t=$(iw ap0 station dump)
if [ ! -z "$t" ]
then
	echo "$t" | awk '{if ($1 ~ /^Station/) { 
			printf "},\"%s\":{",$2
		}
		else{
			gsub(/ /,"_",$0);gsub(/[ \t\/]|dBm|ms/,"",$0); split($0,a,":"); gsub("_","",a[2]); printf "\"%s\":%s,",a[1],a[2]
		}
	}'	
	echo '}'
fi

echo '} }'

