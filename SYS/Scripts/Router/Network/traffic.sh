#!/bin/bash

#for i in `seq 1 1000`
#do


#	echo $i

	echo '{ "internet_down_traffic" : {'

 	echo $(iptables -vnxL internet_down_traffic -t filter | awk '$1 ~ /^[0-9]+$/ { printf "\"%s\":[%d, %d],", $8, $1, $2 }')

	echo '}, "internet_up_traffic" : {'

	echo $(iptables -vnxL internet_up_traffic -t filter | awk '$1 ~ /^[0-9]+$/ { printf "\"%s\":[%d, %d],", $7, $1, $2 }')

	echo '}, "intranet_down_traffic" : {'

	echo $(iptables -vnxL intranet_down_traffic -t filter | awk '$1 ~ /^[0-9]+$/ { printf "\"%s\":[%d, %d],", $8, $1, $2 }')

	echo '}, "intranet_up_traffic" : {'

	echo $(iptables -vnxL intranet_up_traffic -t filter | awk '$1 ~ /^[0-9]+$/ { printf "\"%s\":[%d, %d],", $7, $1, $2 }')

	echo '}}'


#done

