eval(LOG("Device:Bus:BluetoothBus"));

import bluez = require('../../Common/Native/bluez');
import Bus = require("./Bus");
import StatBiz = require('../../Common/Stat/StatBiz');

//early implementation.. without sdp and so on.. just signals / appear and go.
//hci / hci4 needs more work to be differentiated though :(
//hope GATT was the only standard
var _bluetoothBus = new Bus('BLUETOOTH');
var _mac_list = {};

function add_service(mac, name){
    if(!_mac_list[mac]) _mac_list[mac] = {};
    _mac_list[mac][name] = 1;
}
function del_service(mac, name){
    if(!_mac_list[mac]) _mac_list[mac] = {};
    var prev = Object.keys(_mac_list[mac]).length;
    delete _mac_list[mac][name];
    if(prev > 0 && Object.keys(_mac_list[mac]).length == 0){
        _bluetoothBus.DeviceDrop(mac);
    }
}

function _on_device_disappear(mac) {
    //might be some sort of minor probs..
    mac = mac.toLowerCase();
    setTask("BLUETOOTH_DROP_" + mac, () => {
        del_service(mac, 'BEACON');
    }, CONF.BLUETOOTH_DROPWAIT);
}

function _on_device_appear(mac, data, state_change = false) {
    //this can be called multiple times, thus differs from wifi
    if (!mac) return warn(" Invalid MAC - Skipped ");
    mac = mac.toLowerCase();
    clearTask("BLUETOOTH_DROP_" + mac);
    _bluetoothBus.DeviceUp(mac, data, state_change && !_mac_list[mac]); //brand-new!
    add_service(mac, 'BEACON');
    // // one second
    // setTask("BLUETOOTH_LIFE_" + mac, () => {
    //     warn("Force Dropping " + mac + " - MAXTIME PASSED");
    //     _on_device_disappear(mac);
    // }, CONF.BLUETOOTH_MAXLIFE);
}

function drop_all() {
    for (var t in _mac_list) {
        trace("Gracfully Removing " + t);
        _on_device_disappear(t);
    }
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.BLUETOOTH);
    sub.status.on('exit', (exit)=> {
        if (exit) {
            drop_all();
        }
    });
    sub.ofonod.on('set', (mac, oldo, newo) => {
        _bluetoothBus.DeviceUp(mac, {
            HFP: newo.data //this is a stub
        }, newo.data ? !!newo.data.Online : false);
        if(newo.data.Online){
            add_service(mac, 'HFP');
        }else {
            del_service(mac, 'HFP');
        }
    });
    sub.nearby.on('set', (mac, oldTime, lastTime) => {//Found
        _on_device_appear(mac, lastTime, true);
    });
    sub.nearby.on('del', (mac, oldTime) => {//Lost
        _on_device_disappear(mac);
    });
    cb();
}

