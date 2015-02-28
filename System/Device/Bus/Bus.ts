import Node = require("Node");
import Core = require("Core");

/**
    Bus should be categorized based on client-phy-type, 
    [5G_Wifi / 2G4_Wifi] are commonly integrated inside one client-phy, thus 5G_2G4 should be implemented inside one single bus.
*/

class Bus extends Node.events.EventEmitter implements IBus {

    name = (): string => {
        throw new Error("Cannot Call an Abstract Bus");
    }

    start = (cb) => {
        throw new Error("Abstract Bus");
    }

    stop = (cb) => {
        throw new Error("Abstract Bus");
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
        dev.total_uptime = (!!dev.total_uptime ? dev.total_uptime : 0 ) + Date.now() - dev["stamp"];
        if (dev.hwaddr) {
            dev.hwaddr = dev.hwaddr.toLowerCase();
        }
        this.emit("drop", dev);
    }
}

export = Bus;