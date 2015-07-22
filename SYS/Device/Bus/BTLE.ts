import Bus = require("./Bus");
import _gatttool = require('../../Common/Native/gatttool');
import Gatttool = _gatttool.Gatttool;
var _btleBus = new Bus('BTLE');

function _on_device_appear(mac, name) {
    _btleBus.DeviceUp(mac, {
        name: name,
        ble: {}
    });

    var gatttool = new Gatttool(CONF.DEV.BLUETOOTH.DEV_HCI, mac);
    var jobs = [];
    jobs.push((cb)=> {
        gatttool.Primary((err, primary) => {
            cb();
            if (err) return error(err);
            _btleBus.DeviceUp(mac, {
                ble: {
                    primary: primary
                }
            });
        });
    });
    jobs.push((cb)=> {
        gatttool.Characteristics((err, characteristics) => {
            cb();
            if (err) return error(err);
            _btleBus.DeviceUp(mac, {
                ble: {
                    characteristics: characteristics
                }
            });
        });
    });
    async.series(jobs, ()=> {
    });
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.BTLE);

    sub.devices.on('set', (mac, oldValue, name)=> {//Found
        _on_device_appear(mac, name);
    });

    cb();
}