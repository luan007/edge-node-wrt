#!/bin/bash

#TODO: static extract three tables
function getTraffic(){
	iptables -vnxL --line-number -t filter | while read line
	do
	 	t=$(echo "$line" | grep -P -o 'Chain ([\S]+)' | awk '{print $2}')
		#echo $t" "$chain
		if [ -z $t ]
		then
			t=$(echo "$line" | grep -P '\d+\s+\d+\s+\d+\s+' | awk '{ o="\"num\":"$1",\"pkts\":"$2",\"bytes\":"$3",\"target\":\""$4"\",\"prot\":\""$5"\",\"opt\":\""$6"\",\"in\":\""$7"\",\"out\":\""$8"\",\"source\":\""$9"\",\"destination\":\""$10"\""; print o;}')
			if [ ! -z $t ] 
			then
				t="{\"chain\":\""${chain}"\","${t}"},";
				res1=${res1}${t}
			fi
			
		else
			chain=$t
		fi
		echo $res1 > /tmp/.iptables_json
	done

	iptables -vnxL --line-number -t mangle | while read line
	do
	 	t=$(echo "$line" | grep -P -o 'Chain ([\S]+)' | awk '{print $2}')
		#echo $t" "$chain
		if [ -z $t ]
		then
			t=$(echo "$line" | grep -P '\d+\s+\d+\s+\d+\s+' | awk '{ o="\"num\":"$1",\"pkts\":"$2",\"bytes\":"$3",\"target\":\""$4"\",\"prot\":\""$5"\",\"opt\":\""$6"\",\"in\":\""$7"\",\"out\":\""$8"\",\"source\":\""$9"\",\"destination\":\""$10"\""; print o;}')
			if [ ! -z $t ] 
			then
				t="{\"chain\":\""${chain}"\","${t}"},";
				res2=${res2}${t}
			fi
			
		else
			chain=$t
		fi
		echo $res2 > /tmp/.iptables_json2
	done

	iptables -vnxL --line-number -t nat | while read line
	do
	 	t=$(echo "$line" | grep -P -o 'Chain ([\S]+)' | awk '{print $2}')
		#echo $t" "$chain
		if [ -z $t ]
		then
			t=$(echo "$line" | grep -P '\d+\s+\d+\s+\d+\s+' | awk '{ o="\"num\":"$1",\"pkts\":"$2",\"bytes\":"$3",\"target\":\""$4"\",\"prot\":\""$5"\",\"opt\":\""$6"\",\"in\":\""$7"\",\"out\":\""$8"\",\"source\":\""$9"\",\"destination\":\""$10"\""; print o;}')
			if [ ! -z $t ] 
			then
				t="{\"chain\":\""${chain}"\","${t}"},";
				res3=${res3}${t}
			fi
			
		else
			chain=$t
		fi
		echo $res3 > /tmp/.iptables_json3
	done
	
	res="["`cat /tmp/.iptables_json``cat /tmp/.iptables_json2``cat /tmp/.iptables_json3`"]"
	echo $res
}

getTraffic
