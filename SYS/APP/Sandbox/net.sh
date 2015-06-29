#PARAM 1: pid
#PARAM 2: ip

mkdir -p /var/run/netns
rm -rf /var/run/netns/$1
ln -s /proc/$1/ns/net /var/run/netns/$1
ip link add host_$1 type veth peer name app_$1
brctl addif VETH host_$1
ip link set app_$1 netns $1

ip netns exec $1 ifconfig app_$1 $2
ip netns exec $1 ip link set lo up
ip netns exec $1 ip link set app_$1 up

ip netns exec $1 route add default gw 169.254.0.1 app_$1