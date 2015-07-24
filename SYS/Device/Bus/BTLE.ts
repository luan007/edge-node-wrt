import Bus = require("./Bus");
import Gatttool = require('../../Common/Native/gatttool');
var _btleBus = new Bus('BTLE');

function _on_device_appear(mac, device) {
    _btleBus.DeviceUp(mac, device);
}

function _on_device_disappear(mac){
    _btleBus.DeviceDrop(mac);
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.BTLE);

    sub.devices.on('set', (mac, oldValue, device)=> {//Found
        _on_device_appear(mac, device);
    });

    sub.devices.on('del', (mac, oldValue)=>{
        _on_device_disappear(mac);
    });

    cb();
}