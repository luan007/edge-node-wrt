#!/bin/bash

echo '{'

t=$(iw ap1 station dump)
if [ ! -z "$t" ]
then
	echo "$t" | awk '{if ($1 ~ /^Station/) { 
			printf "},\"%s\":{",$2
		}
		else{
			gsub(/[ \t]+/,"",$0); split($0,a,":"); printf "\"%s\":\"%s\",",a[1],a[2]
		}
	}'
	echo '}'
fi

t=$(iw ap0 station dump)
if [ ! -z "$t" ]
then
	echo "$t" | awk '{if ($1 ~ /^Station/) { 
			printf "}\"%s\":{",$2
		}
		else{
			gsub(/[ \t]+/,"",$0); split($0,a,":"); printf "\"%s\":\"%s\",",a[1],a[2]	
		}
	}'	
	echo '}'
fi

echo '}'

