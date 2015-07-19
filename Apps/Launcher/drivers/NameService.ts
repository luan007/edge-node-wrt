/// <reference path="../global.d.ts" />
//Resolve Device Name into DNS domains
//Also generates generic "name" if there's nothing set
//

var _name_cache = [[], [], []]; //Le multi

var _key = UUIDstr();

//Le [host, name, alias]
function find_good_spot(name, cb) {
    console.log("Finding spot for " + name);
    var cur = name;
    var counter = 0;
    var job = () => {
        API.Network.CheckNameAvailability(cur, (result) => {
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


function _update_name(dev: IDevice, _cb) {
    _cb = _cb || (() => {
    });
    intoQueue("dhcp_operation", (cb) => {
        var lease = dev.bus.data.Lease;
        var host = lease.Hostname.trim();
        var ip = lease.Address;
        var name = dev.config.name;
        var alias = dev.config.alias;

        console.log('lease', lease);

        if (!lease) {
            return cb();
        }

        var changed = false;

        var h = {};
        h[host] = ip;
        if (host && host != "" && host.indexOf("*") < 0 && !_.isEqual(this._name_cache[0][dev.id], h)) {
            //good
            console.log('hostname', host, ip, dev.id);
            _name_cache[0][dev.id] = h;
            changed = true;
        }


        var d = {};
        d[name] = ip;
        if (name && name != "" && name.indexOf("*") < 0 && name != host && !_.isEqual(this._name_cache[1][dev.id], d)) {
            //good
            _name_cache[1][dev.id] = d;
            changed = true;
        }
        if (Array.isArray(alias)) {
            //good
            if (!_name_cache[2][dev.id]) {
                _name_cache[2][dev.id] = {};
            }
            for (var a in _name_cache[2][dev.id]) {
                var found = false;
                for (var i = 0; i < alias.length; i++) {
                    if (alias[a]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    delete _name_cache[2][dev.id][a];
                    changed = true;
                }
            }
            for (var i = 0; i < alias.length; i++) {
                if (_name_cache[2][dev.id][alias[i]] != ip) {
                    _name_cache[2][dev.id][alias[i]] = ip;
                    changed = true;
                }
            }
        }
        if (!changed) {
            cb();
        }
        else {
            //console.log('-----<<<', this._name_cache);
            var hostnames = {};
            for (var w in _name_cache) {
                for (var k in _name_cache[w]) {
                    for (var z in _name_cache[w][k])
                        hostnames[z] = _name_cache[w][k][z];
                }
            }
            API.Network.SetDNSHostname(hostnames, cb);
        }
    }, _cb);
};


function _remove_name(dev: IDevice, cb) {
    cb = cb || (() => {
    });
    intoQueue("dhcp_operation", (c) => {
        delete _name_cache[0][dev.id];
        delete _name_cache[1][dev.id];
        delete _name_cache[2][dev.id];

        var hostnames = {};
        for (var w in _name_cache) {
            for (var k in _name_cache[w]) {
                for (var z in _name_cache[w][k])
                    hostnames[z] = _name_cache[w][k][z];
            }
        }
        API.Network.SetDNSHostname(hostnames, c);
    }, cb);
}

var NameService: IInAppDriver = {

    match : (dev: IDevice, delta, cb: Callback) => {
        //IpAddress is required
        return cb(undefined, !!dev.bus.data.Lease && dev.state);
    },

    attach : (dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) => {
        if (!dev.bus.data.Lease) {
            return cb(new Error("Lease is missing"), undefined);
        } else {
            //What's your name?
            _update_name(dev, () => {
                //do nothing
            });
            cb(undefined, { valid: true });
        }
    },

    change : (dev: IDevice, delta: IDriverDetla, cb: PCallback<IDeviceAssumption>) => {
        console.log('NameService CHANGE Called.');
        if (!dev.bus.data.Lease || dev.state < 1) {
            _remove_name(dev, () => {
            });
        } else {
            _update_name(dev, () => {
                //do nothing
            });
        }
        var assumption: IDeviceAssumption = { valid: true };
        var lease = dev.bus.data.Lease;
        var hostname = lease.Hostname.trim();
        if (hostname) {
            assumption.attributes = {};
            assumption.attributes['name'] = hostname;
        }
        return cb(undefined, assumption);
    },

    detach : (dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) => {
        _remove_name(dev, () => {
            //do nothing
        });
        return cb(undefined, { valid: true });
    },

    load : (cb: Callback) => {
        //Core.Router.Network.dnsmasq.Hosts[this._key] = this._name_cache; //no clash
        return cb(undefined, true);
    },

    unload : (cb: Callback) => {
        return cb();
    },

    invoke : (dev, actionId, params, cb) => {
        return cb();
    }

}

export = NameService;