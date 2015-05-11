import bluez = require('../../Common/Native/bluez');
import Bus = require("./Bus");

//early implementation.. without sdp and so on.. just signals / appear and go.
//hci / hci4 needs more work to be differentiated though :(
//hope GATT was the only standard
class Bluetooth extends Bus {

    constructor(public BluezInstance:bluez.Bluez) {
        super('BLUETOOTH');
    }

    _mac_list = {};

    _on_device_disappear = (mac) => {
        //might be some sort of minor probs..
        mac = mac.toLowerCase();
        setTask("BLUETOOTH_DROP_" + mac, () => {
            this.DeviceDrop(mac);
            this._mac_list[mac] = undefined;
        }, CONF.BLUETOOTH_DROPWAIT);
    };

    _on_device_appear = (mac) => {
        //this can be called multiple times, thus differs from wifi
        if (!mac) return warn(" Invalid MAC - Skipped ");
        mac = mac.toLowerCase();
        clearTask("BLUETOOTH_DROP_" + mac);
        if (this._mac_list[mac]) {
            //emm possible RSSI change
            this.DeviceUp(mac, {
                data: this.BluezInstance.Get(mac).Properties //expand properties
            });
        } else {
            var baseProperty = this.BluezInstance.Get(mac).Properties;
            this._mac_list[mac] = 1;
            //Register All handlers?
            this.DeviceUp(mac,
                baseProperty //expand properties
            );
        }

        //再续一秒
        setTask("BLUETOOTH_LIFE_" + mac, () => {
            warn("Force Dropping " + mac + " - MAXTIME PASSED");
            this._on_device_disappear(mac);
        }, CONF.BLUETOOTH_MAXLIFE);
    };

    drop_all = () => {
        for (var t in this._mac_list) {
            trace("Gracfully Removing " + t);
            this._on_device_disappear(t);
        }
    };

    _start = (cb) => {
        this._mac_list = {};
        this.BluezInstance.on("exit", this.drop_all);
        this.BluezInstance.on("stop", this.drop_all);

        this.BluezInstance.on("Found", (mac:string) => {
            this._on_device_appear(mac);
        });
        this.BluezInstance.on("Lost", (mac:string) => {
            this._on_device_disappear(mac);
        });
        cb();
    };

    _stop = (cb) => {
        this.drop_all();
        this.BluezInstance.removeAllListeners();
        cb();
    };
}

export = Bluetooth;


