#!/bin/ash

#for i in `seq 1 1000`
#do


#	echo $i

	echo '{ "internet_down_traffic" : {'

 	echo $(iptables -w -vnxL internet_down_traffic -t filter | awk '$1 ~ /^[0-9]+$/ { printf "\"%s\":[%d, %d],", $8, $1, $2 }')

	echo '}, "internet_up_traffic" : {'

	echo $(iptables -w -vnxL internet_up_traffic -t filter | awk '$1 ~ /^[0-9]+$/ { printf "\"%s\":[%d, %d],", $7, $1, $2 }')

	echo '}, "intranet_down_traffic" : {'

	echo $(iptables -w -vnxL intranet_down_traffic -t filter | awk '$1 ~ /^[0-9]+$/ { printf "\"%s\":[%d, %d],", $8, $1, $2 }')

	echo '}, "intranet_up_traffic" : {'

	echo $(iptables -w -vnxL intranet_up_traffic -t filter | awk '$1 ~ /^[0-9]+$/ { printf "\"%s\":[%d, %d],", $7, $1, $2 }')

	echo '}, "total_traffic" : {'

	echo $(iptables -w -vnxL FORWARD -t filter | awk 'NR>2 && NR <7 { printf "\"%s\":[%d, %d],", $3, $1, $2 }')

	echo '}}'


#done

