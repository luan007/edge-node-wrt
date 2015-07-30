eval(LOG("Device:Bus:Dummy"));

import Bus = require("./Bus");

class Dummy extends Bus {

    name = ():string => {
        return "Dummy";
    };

    start = (cb) => {
        cb();
        setInterval(() => {
            this.DeviceUp("00:00:00:11:22:33",  {
                    val: Math.random()
                }
            );
        }, 2000);
    };

    stop = (cb) => {
        cb();
    };

}

export = Dummy;