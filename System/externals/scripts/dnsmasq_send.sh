#!/bin/ash

echo "{\"action\": \"SET\", \"name\": \"dnsmasq\", \"data\": { \"Action\":\"$1\", \"Lease\": { \"Mac\":\"$2\", \"Address\":\"$3\", \"Hostname\":\"$4\", \"VendorClass\":\"$DNSMASQ_VENDOR_CLASS\", \"Interface\":\"$DNSMASQ_INTERFACE\" }}}" | socat - UNIX-SENDTO:/tmp/fdsock/light_queue.sock
