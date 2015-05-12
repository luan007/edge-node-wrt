import bluez = require('../../Common/Native/bluez');
import Bus = require("./Bus");
import StatMgr = require('../../Common/Stat/StatMgr');
import StatBiz = require('../../Common/Stat/StatBiz');

//early implementation.. without sdp and so on.. just signals / appear and go.
//hci / hci4 needs more work to be differentiated though :(
//hope GATT was the only standard
var _bluetoothBus = new Bus('BLUETOOTH');
var _mac_list = {};

function _on_device_disappear(mac) {
    //might be some sort of minor probs..
    mac = mac.toLowerCase();
    setTask("BLUETOOTH_DROP_" + mac, () => {
        _bluetoothBus.DeviceDrop(mac);
        _mac_list[mac] = undefined;
    }, CONF.BLUETOOTH_DROPWAIT);
}

function _on_device_appear(mac) {
    //this can be called multiple times, thus differs from wifi
    if (!mac) return warn(" Invalid MAC - Skipped ");
    mac = mac.toLowerCase();
    clearTask("BLUETOOTH_DROP_" + mac);
    if (_mac_list[mac]) {
        //emm possible RSSI change
        _bluetoothBus.DeviceUp(mac, {
            data: StatBiz.GetBluetoothPropertiesByMac(mac) //expand properties
        });
    } else {
        var baseProperty = StatBiz.GetBluetoothPropertiesByMac(mac);
        _mac_list[mac] = 1;
        //Register All handlers?
        _bluetoothBus.DeviceUp(mac,
            baseProperty //expand properties
        );
    }

    // one second
    setTask("BLUETOOTH_LIFE_" + mac, () => {
        warn("Force Dropping " + mac + " - MAXTIME PASSED");
        this._on_device_disappear(mac);
    }, CONF.BLUETOOTH_MAXLIFE);
}

function drop_all() {
    for (var t in this._mac_list) {
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

    sub.nearby.on('set', (mac, oldTime, lastTime)=> {//Found
        _on_device_appear(mac);
    });
    sub.nearby.on('del', (mac, oldTime) => {//Lost
        _on_device_disappear(mac);
    });

    cb();
}

