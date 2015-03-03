import Node = require("Node");
import Core = require("Core");

class TestDriver implements IDriver {

    id() {
        return "_TEST_DRV_";
    }

    interest(): IDriverInterest {
        return {
            match: [
                {
                    delta: {
                        bus:
                        {
                            "MDNS": {
                                $has: true
                            }
                        }
                    }
                },
                {
                    bus: {
                        "data.Lease": {
                            $has: true
                        }
                    }
                }],
            //change: {
            //    delta: {
            //        bus: {
            //            "Traffic.Up.Rate.Bps": { $gt: 100000 }
            //        }
            //    }
            //}
        };
    }

    name() {
        return "TestDriver";
    }

    status() {
        return 1; //always on..
    }

    bus(): string[]{
        return [ "WLAN" ];
    }

    match(dev: IDevice, delta, cb: Callback) {
        for (var i in dev.bus.data.MDNS) {
            if (i == "_pdl-datastream._tcp.") {
                trace(i);
                return cb(undefined, dev.bus.data.MDNS[i]);
            }
        }
        //cb(undefined, { foo:"bar" });
        return cb(undefined, undefined);
    }

    attach(dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) {
        info("ATTACH Called");

        var d = matchResult[Object.keys(matchResult)[0]];
        var addr = dev.bus.data.Lease.Address;

        trace(addr + ":" + d.port);
        trace(d.name);

        //var sock = Node.net.connect({ host: addr, port: d.port },(con) => {
        //    sock.write("Helloworld");
        //    sock.end();
        //});

        cb(undefined, {
            actions: {},
            attributes: {},
            classes: {},
            valid: true
        });
    }

    change(dev: IDevice, delta : IDriverDetla, cb: PCallback<IDeviceAssumption>) {
        //fatal(delta.bus["Traffic"].Up.Rate.Bps);
        cb(undefined, {
            actions: {},
            attributes: {},
            classes: {},
            valid: true
        });
    }

    detach(dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) {

    }

    load(cb: Callback) {
        cb();
    }

    unload(cb: Callback) {

    }

    invoke(dev, actionId, params, cb) {

    }

}

export var Instance = new TestDriver();