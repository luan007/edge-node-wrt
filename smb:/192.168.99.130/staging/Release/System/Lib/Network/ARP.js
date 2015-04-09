var arp = require("node-arp");
var arp_cache = {};
function GetMAC(ipAddress, callback) {
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
    arp.getMAC(ipAddress, function (e, m) {
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
exports.GetMAC = GetMAC;
function Initialize() {
    global.macaddr = GetMAC;
}
exports.Initialize = Initialize;
