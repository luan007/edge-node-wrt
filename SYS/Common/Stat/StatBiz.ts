import StatMgr = require('./StatMgr');
import Dnsmasq = require('../../Common/Native/dnsmasq');

export function GetMacByIP(IP:string) {
    var networkStatues = StatMgr.Get(SECTION.NETWORK);
    if (networkStatues && networkStatues.leases) {
        for (var mac in networkStatues.leases) {
            var lease = <Dnsmasq.IDHCPLease>networkStatues.leases[mac];
            if (lease.Address === IP)
                return lease.Mac;
        }
    }
    return null;
}

export function GetIPByMac(mac:string) {
    var networkStatues = StatMgr.Get(SECTION.NETWORK);
    if (networkStatues && networkStatues.leases) {
        if (networkStatues.leases.hasOwnProperty(mac))
            return networkStatues.leases[mac].Address;
    }
    return null;
}

export function GetBluetoothPropertiesByMac(mac:string) {
    var bluetoothStatues = StatMgr.Get(SECTION.BLUETOOTH);
    if (bluetoothStatues && bluetoothStatues.devices) {
        if (bluetoothStatues.devices.hasOwnProperty(mac)) {
            return bluetoothStatues.devices[mac];
        }
    }
    return null;
}