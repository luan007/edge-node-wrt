import events = require('events');

/**
    Bus should be categorized based on client-phy-type, 
    [5G_Wifi / 2G4_Wifi] are commonly integrated inside one client-phy, thus 5G_2G4 should be implemented inside one single bus.
*/

class Bus extends events.EventEmitter implements IBus {

    private _started = false;

    name = (): string => {
        throw new Error("Cannot Call an Abstract Bus");
    }

    start = (cb) => {
        trace(" Start - " + this.name);
        if (this._started) return cb(new Error("Already Started"));
        this._start((err, result) => {
            if (err) return cb(err);
            this._started = true;
            return cb(err, result);
        });
    }

    protected _start = (cb) => {
        throw new Error("Abstract Bus");
    }

    protected _stop = (cb) => {
        throw new Error("Abstract Bus");
    }

    stop = (cb) => {
        warn(" Stop - " + this.name);
        if (!this._started) return cb(new Error("Not yet Started"));
        this.stop((err, result) => {
            if (err) return cb(err);
            this._started = false;
            return cb(err, result);
        });
    }

    protected _on_device = (dev: IBusData) => {
        dev.name = this.name();
        dev.stamp = Date.now();
        if (dev.hwaddr) {
            dev.hwaddr = dev.hwaddr.toLowerCase();
        }
        this.emit("device", dev);
    }

    protected _on_drop = (dev: IBusData) => {
        dev.name = this.name();
        dev.total_uptime = (dev.total_uptime !== undefined ? dev.total_uptime : 0 ) + Date.now() - dev["stamp"];
        if (dev.hwaddr) {
            dev.hwaddr = dev.hwaddr.toLowerCase();
        }
        this.emit("drop", dev);
    }
}

export = Bus;