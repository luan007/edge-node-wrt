import StatMgr = require('./StatMgr');
import Dnsmasq = require('../../Common/Native/dnsmasq');

export function GetMacByIP(IP:string) {
    var networkStatues = <any>StatMgr.Get(SECTION.NETWORK).ValueOf();
    //console.log('GetMacByIP networkStatues', require('util').inspect(networkStatues));
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
    var networkStatues = <any>StatMgr.Get(SECTION.NETWORK).ValueOf();
    //console.log('GetIPByMac networkStatues', require('util').inspect(networkStatues));
    if (networkStatues && networkStatues.leases) {
        if (networkStatues.leases.hasOwnProperty(mac))
            return networkStatues.leases[mac].Address;
    }
    return null;
}

export function GetBluetoothPropertiesByMac(mac:string) {
    var bluetoothStatues = <any>StatMgr.Get(SECTION.BLUETOOTH).ValueOf();
    //console.log('GetBluetoothPropertiesByMac bluetoothStatues', require('util').inspect(bluetoothStatues));
    if (bluetoothStatues && bluetoothStatues.devices) {
        if (bluetoothStatues.devices.hasOwnProperty(mac)) {
            return bluetoothStatues.devices[mac];
        }
    }
    return null;
}