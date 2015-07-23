import Bus = require("./Bus");
import Gatttool = require('../../Common/Native/gatttool');
var _btleBus = new Bus('BTLE');

function _on_device_appear(mac, name) {
    _btleBus.DeviceUp(mac, {
        name: name,
        BTLE: {}
    });

    var jobs = [];
    jobs.push((cb)=> {
        Gatttool.Primary(CONF.DEV.BLUETOOTH.DEV_HCI, mac, (err, primary) => {
            cb();
            if (err) return error(err);
            _btleBus.DeviceUp(mac, {
                BTLE: {
                    primary: primary
                }
            });
        });
    });
    jobs.push((cb)=> {
        Gatttool.Characteristics(CONF.DEV.BLUETOOTH.DEV_HCI, mac, (err, characteristics) => {
            cb();
            if (err) return error(err);
            _btleBus.DeviceUp(mac, {
                BTLE: {
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