import events = require('events');
import DeviceManager = require('../DeviceManager');

class Bus extends events.EventEmitter implements IBus {

    constructor(private _name: string) {
        super();
        DeviceManager.RegisterBus(this);
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

    public DeviceUp = (hwaddr: string, devData, stateChanged=false) => {
        this.emit("device", {
            name : this._name,
            stamp: Date.now(),
            hwaddr: hwaddr.toLowerCase(),
            data: devData
        }, stateChanged);
    }

    public DeviceDrop = (hwaddr: string, devData = {}) => {
        this.emit("drop", {
            name : this._name,
            stamp: Date.now(),
            hwaddr: hwaddr.toLowerCase(),
            data: devData
        });
    }
}

export = Bus;