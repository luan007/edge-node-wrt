eval(LOG("Device:Bus:BluetoothBus"));

import Bus = require("./Bus");

var dummy = new Bus('DUMMY');

SYS_ON(SYS_EVENT_TYPE.LOADED, ()=>{
    setTimeout(function(){
        console.log("RUNNING TEST, GENERATING NEW DUMMY DEVICE");
        dummy.DeviceUp("00:00:00:00:00:00", { /*Nothing*/ });
    }, 5000);
    setTimeout(function(){
        console.log("RUNNING TEST #2, GENERATING DATA");
        dummy.DeviceUp("00:00:00:00:00:00", { 
            SettleTime: Date.now()
        });
    }, 5000);
});