import Bus = require("./Bus");

class Dummy extends Bus {

    name = (): string => {
        return "Dummy";
    };

    start = (cb) => {
        cb();
        setInterval(() => {
            this._on_device({
                hwaddr: "00:00:00:11:22:33",
                data: {
                    val: Math.random()
                }
            });
        }, 2000);
    };

    stop = (cb) => {
        cb();
    };

}

export = Dummy;