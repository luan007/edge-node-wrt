#!/bin/bash

res='['


raw=$(iptables -vnxL -t filter --line-number)
junk=(${raw// /\_})
for line in ${junk[@]}
do
	good=${line//_/ }
	t=$(echo "$good" | grep -E -o 'Chain \S+' | awk '{print $2}')

	if [ -z $t ]
	then
		t=$(echo "$good" | grep -E '[[:digit:]]+[[:blank:]]+[[:digit:]]+[[:blank:]]+[[:digit:]]+[[:blank:]]+' | awk '{ o="\"num\":"$1",\"pkts\":"$2",\"bytes\":"$3",\"target\":\""$4"\",\"prot\":\""$5"\",\"opt\":\""$6"\",\"in\":\""$7"\",\"out\":\""$8"\",\"source\":\""$9"\",\"destination\":\""$10"\""; print o;}')
		if [ ! -z $t ]
		then
			t="{\"chain\":\""${chain}"\","${t}"},";
			res=${res}${t}
		fi

	else
		chain=$t
	fi

done


#table: filter
#declare -a arr=('INPUT' 'FORWARD' 'OUTPUT' 'drop_incoming' 'fw_custom' 'fw_sys' 'in_custom' 'in_sys' 'internet_down_traffic' 'internet_up_traffic' 'intranet_traffic' 'ot_custom' 'ot_sys' 'vlan_isolation')
#for chain in ${arr[@]}
#do
#	t=${t}$(iptables -vnxL $chain --line-number -t filter | grep '[[:digit:]]\+[[:blank:]]\+[[:digit:]]\+[[:blank:]]\+[[:digit:]]\+' | awk -v chain="$chain" '{ o="{\"chain\":\""chain"\",\"num\":"$1",\"pkts\":"$2",\"bytes\":"$3",\"target\":\""$4"\",\"prot\":\""$5"\",\"opt\":\""$6"\",\"in\":\""$7"\",\"out\":\""$8"\",\"source\":\""$9"\",\"destination\":\""$10"\"},"; print o;}')
#done

#table: mangle
#declare -a arr=('PREROUTING' 'INPUT' 'FORWARD' 'OUTPUT' 'POSTROUTING' 'post_traffic' 'pre_traffic')
#for chain in ${arr[@]}
#do
#	t=${t}$(iptables -vnxL $chain --line-number -t mangle | grep '[[:digit:]]\+[[:blank:]]\+[[:digit:]]\+[[:blank:]]\+[[:digit:]]\+' | awk -v chain="$chain" '{ o="{\"chain\":\""chain"\",\"num\":"$1",\"pkts\":"$2",\"bytes\":"$3",\"target\":\""$4"\",\"prot\":\""$5"\",\"opt\":\""$6"\",\"in\":\""$7"\",\"out\":\""$8"\",\"source\":\""$9"\",\"destination\":\""$10"\"},"; print o;}')
#done

#table: nat
#declare -a arr=('PREROUTING' 'INPUT''OUTPUT''POSTROUTING' 'nginx_proxy' 'post_sys' 'pre_sys' 'routing_masquerade' 'wifi_nat')
#for chain in ${arr[@]}
#do
#	t=${t}$(iptables -vnxL $chain --line-number -t nat | grep '[[:digit:]]\+[[:blank:]]\+[[:digit:]]\+[[:blank:]]\+[[:digit:]]\+' | awk -v chain="$chain" '{ o="{\"chain\":\""chain"\",\"num\":"$1",\"pkts\":"$2",\"bytes\":"$3",\"target\":\""$4"\",\"prot\":\""$5"\",\"opt\":\""$6"\",\"in\":\""$7"\",\"out\":\""$8"\",\"source\":\""$9"\",\"destination\":\""$10"\"},"; print o;}')
#done

res=${res}']'
echo $res