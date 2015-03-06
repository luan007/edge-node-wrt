import Node = require("Node");
import Core = require("Core");

//Resolve Device Name into DNS domains
//Also generates generic "name" if there's nothing set
//
class NameService implements IDriver {

    //Le [host, name, alias]
    private _name_cache = [[], [], []]; //Le multi

    private _key = UUIDstr();

    constructor() {
    }

    _interest = {
        match: {
            config: {
                $or: [
                    { name: { $exists: true } },
                    { alias: { $exists: true } }
                ]
            },
            bus: {
                "data.Lease": { $exists: true }
            }
        },
        change: {
            delta: {
                bus: {
                    "Lease": { $exists: true }
                }
            },
            stateChange: true
        }
    };

    id() {
        return "NameService";
    }

    interest(): IDriverInterest {
        return this._interest;
    }

    name() {
        return "NameService";
    }

    status() {
        return 1; //always on..
    }

    bus(): string[] {
        return ["WLAN"];
    }

    private find_good_spot = (name, cb) => {
        trace("Finding spot for " + name);
        var cur = name;
        var counter = 0;
        var job = () => {
            Core.Router.Network.dnsmasq.CheckNameAvailability(cur,(result) => {
                if (result) {
                    cb(cur);
                }
                else {
                    cur = cur + "_" + (counter++);
                    process.nextTick(job);
                }
            });
        };
        process.nextTick(job);
    };

    private _update_name = (dev: IDevice, _cb) => {
        _cb = _cb || (() => { });
        intoQueue("dhcp_operation",(c) => {
            //delete this._name_cache[0][dev.id];
            //delete this._name_cache[1][dev.id];
            //delete this._name_cache[2][dev.id];

            var lease = dev.bus.data.Lease;
            var host = lease.Hostname.trim();
            var ip = lease.Address;
            var name = dev.config.name;
            var alias = dev.config.alias;

            if (!lease) {
                return c();
            }

            //if (host == "Windows-Phone") {
            //    alias = ["HELLOWORLD"]; //test
            //    trace("Found Test Subject");
            //}

            //if (host && host != "" && host.indexOf("*") < 0) {
            //    //good
            //    jobs.push((cb) => {
            //        this.find_good_spot(host,(spot) => {
            //            this._name_cache[0][dev.id] = { spot: ip };
            //            cb();
            //        });
            //    });
            //}
            var changed = false;
            if (name && name != "" && name.indexOf("*") < 0 && name != host &&
                !_.isEqual(this._name_cache[1][dev.id], { name: ip })) {
                //good
                this._name_cache[1][dev.id] = { name: ip };
                changed = true;
            }
            if (Array.isArray(alias)) {
                //good
                if (!this._name_cache[2][dev.id]) {
                    this._name_cache[2][dev.id] = {};
                }
                for (var a in this._name_cache[2][dev.id]) {
                    var found = false;
                    for (var i = 0; i < alias.length; i++) {
                        if (alias[a]) {
                            var found = true;
                            break;
                        }
                    }
                    if (!found) {
                        delete this._name_cache[2][dev.id][a];
                        changed = true;
                    }
                }
                for (var i = 0; i < alias.length; i++) {
                    if (this._name_cache[2][dev.id][alias[i]] != ip) {
                        this._name_cache[2][dev.id][alias[i]] = ip;
                        changed = true;
                    }
                }
            }
            if (!changed) {
                c();
            }
            else {
                Core.Router.Network.dnsmasq.SIGHUP_Update(c);
            }
        }, _cb);
    };

    private _remove_name = (dev: IDevice, cb) => {
        cb = cb || (() => { });
        intoQueue("dhcp_operation",(c) => {
            delete this._name_cache[0][dev.id];
            delete this._name_cache[1][dev.id];
            delete this._name_cache[2][dev.id];
            Core.Router.Network.dnsmasq.SIGHUP_Update(c);
        }, cb);
    };

    match(dev: IDevice, delta: IDriverDetla, cb: Callback) {
        //IpAddress is required
        return cb(undefined, !!dev.bus.data.Lease);
    }

    attach(dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) {
        if (!dev.bus.data.Lease) {
            return cb(new Error("Lease is missing"), undefined);
        } else {
            //What's your name?
            this._update_name(dev,() => {
                //do nothing
            });
            cb(undefined, { valid : true });
        }
    }

    change(dev: IDevice, delta: IDriverDetla, cb: PCallback<IDeviceAssumption>) {
        if (!dev.bus.data.Lease) {
            this._remove_name(dev,() => { });
        } else {
            this._update_name(dev,() => {
                //do nothing
            });
        }
        return cb(undefined, { valid: true });
    }

    detach(dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) {
        this._remove_name(dev,() => {
            //do nothing
        });
        return cb(undefined, { valid: true });
    }

    load = (cb: Callback) => {
        Core.Router.Network.dnsmasq.Hosts[this._key] = this._name_cache; //no clash
        return cb();
    };

    unload(cb: Callback) {
        return cb();
    }

    invoke(dev, actionId, params, cb) {

    }

}

export var Instance = new NameService();