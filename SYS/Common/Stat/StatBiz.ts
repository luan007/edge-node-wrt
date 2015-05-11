import StatMgr = require('./StatMgr');
import Dnsmasq = require('../../Common/Native/dnsmasq');

export function GetMacByIP(IP:string) {
    var networkStatues = StatMgr.Get(SECTION.NETWORK);
    if (networkStatues && networkStatues.leases) {
        for (var i = 0, len = networkStatues.leases.length; i < len; i++) {
            var lease = <Dnsmasq.IDHCPLease>networkStatues.leases[i]
            if (lease.Address === IP)
                return lease.Mac;
        }
    }
    return null;
}

export function GetIPByMac(mac:string) {
    var networkStatues = StatMgr.Get(SECTION.NETWORK);
    if (networkStatues && networkStatues.leases) {
        for (var i = 0, len = networkStatues.leases.length; i < len; i++) {
            var lease = <Dnsmasq.IDHCPLease>networkStatues.leases[i]
            if (lease.Mac === mac)
                return lease.Address;
        }
    }
    return null;
}