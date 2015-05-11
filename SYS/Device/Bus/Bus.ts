import events = require('events');

class Bus extends events.EventEmitter implements IBus {

    constructor(private _name: string) {
        super();
    }

    name = (): string => {
        return this._name;
    }

    start = (cb) => {
        throw new Error("Abstract Bus");
    }

    stop = (cb) => {
        throw new Error("Abstract Bus");
    }

    public DeviceUp = (hwaddr: string, devData) => {
        this.emit("device", {
            name : this._name,
            stamp: Date.now(),
            hwaddr: hwaddr.toLowerCase(),
            data: devData
        });
    }

    public DeviceDrop = (hwaddr: string, devData = {}) => {
        this.emit("drop", {
            name : this._name,
            stamp: Date.now(),
            hwaddr: hwaddr.toLowerCase(),
            data: devData
        });
        //TODO: FIX TOTAL UPTIME
        //dev.total_uptime = (dev.total_uptime !== undefined ? dev.total_uptime : 0 ) + Date.now() - dev["stamp"];
    }
}

export = Bus;