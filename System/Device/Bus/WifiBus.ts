import Bus = require('./Bus');

var _wifiBus = new Bus('WIFI');
function on_connect(mac, station) {
    if (!mac) return console.log(" Invalid MAC - Skipped ".red);
    mac = mac.toLowerCase();

    _wifiBus.DeviceUp(mac, {
        Addr: {},
        Lease: {},
        Wireless: station,
        Traffic: {},
        MDNS: {},
        SSDP: {},
        Band: station.band,
        P0F: {}
    }, true);
}

export function OnLease(mac, lease) {
    if(Hostapd.GetStation(mac)) {
        _wifiBus.DeviceUp(mac, {
            Lease: lease
        });
    }
}
export function DropLease(mac, lease) {
    _wifiBus.DeviceUp(mac, {
        Lease: {}
    });
}

export function OnStation(mac, station){
    on_connect(mac, station);
}
export function DropStation(mac, station) {
    _wifiBus.DeviceDrop(mac);
}