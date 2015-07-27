import StatMgr = require('./StatMgr');

//export interface IDHCPLease {
//    Mac: string;
//    Address: string;
//    Hostname: string;
//    VendorClass: string;
//    Interface: string;
//}

export function GetMacByIP(IP:string) {
    var networkStatues = <any>StatMgr.Get(SECTION.NETWORK).ValueOf();
    //console.log('GetMacByIP networkStatues', require('util').inspect(networkStatues));
    if (networkStatues && networkStatues.arp) {
        for (var mac in networkStatues.arp) {
            var arp = networkStatues.arp[mac];
            if (arp.Address === IP)
                return arp.Mac;
        }
    }
    if (networkStatues && networkStatues.leases) {
        for (var mac in networkStatues.leases) {
            var lease = networkStatues.leases[mac];
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

export function GetMDNSByIP(IP:string) {
    var networkStatues = <any>StatMgr.Get(SECTION.NETWORK).ValueOf();
    if (networkStatues && networkStatues.mdns) {
        if (networkStatues.mdns.hasOwnProperty(IP))
            return networkStatues.mdns[IP];
    }
    return null;
}

export function GetRuntimeIdByAppUid(appUid:string){
    var runtimeStatues = <any>StatMgr.Get(SECTION.RUNTIME).ValueOf();
    if (runtimeStatues && runtimeStatues.apps) {
        if(runtimeStatues.apps.hasOwnProperty(appUid))
            return runtimeStatues.apps[appUid].RuntimeId;
    }
    return null;
}

export function GetUserState(userId:string) {
    var userStatues = <any>StatMgr.Get(SECTION.USER).ValueOf();
    if (userStatues && userStatues.online) {
        if(userStatues.online.hasOwnProperty(userId))
            return userStatues.online[userId];
    }
    return 0;
}