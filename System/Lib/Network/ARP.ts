

var arp :any = require("node-arp");

var arp_cache: ARP_Record[] = <any>{};

export function GetMAC(ipAddress, callback: (err, mac) => void) {
    var time = new Date().getTime();
    if (arp_cache[ipAddress]) {
        var a = arp_cache[ipAddress];
        if (time - a.scanTime < CONF.ARP_TIMEOUT) {
            return callback(null, arp_cache[ipAddress].MAC);
        }
        else {
            delete arp_cache[ipAddress];
        }
    }

    arp.getMAC(ipAddress, (e, m) => {
        if (e) {
            callback(e, null);
        }
        else if (!m) {
            callback(new Error("No MAC"), null);
        }
        else {
            arp_cache[ipAddress] = {
                ipAddress: ipAddress,
                MAC: m,
                scanTime: new Date().getTime()
            };
            callback(null, m);
        }
    });
}

export function Initialize() {
    global.macaddr = GetMAC;
}