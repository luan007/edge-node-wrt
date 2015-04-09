var Core = require("Core");
var NameService = (function () {
    function NameService() {
        var _this = this;
        this._name_cache = [[], [], []];
        this._key = UUIDstr();
        this._interest = {
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
        this.id = function () {
            return "NameService";
        };
        this.interest = function () {
            return _this._interest;
        };
        this.name = function () {
            return "NameService";
        };
        this.status = function () {
            return 1;
        };
        this.bus = function () {
            return ["WLAN"];
        };
        this.find_good_spot = function (name, cb) {
            trace("Finding spot for " + name);
            var cur = name;
            var counter = 0;
            var job = function () {
                Core.Router.Network.dnsmasq.CheckNameAvailability(cur, function (result) {
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
        this._update_name = function (dev, _cb) {
            _cb = _cb || (function () {
            });
            intoQueue("dhcp_operation", function (c) {
                var lease = dev.bus.data.Lease;
                var host = lease.Hostname.trim();
                var ip = lease.Address;
                var name = dev.config.name;
                var alias = dev.config.alias;
                if (!lease) {
                    return c();
                }
                var changed = false;
                if (name && name != "" && name.indexOf("*") < 0 && name != host && !_.isEqual(_this._name_cache[1][dev.id], { name: ip })) {
                    _this._name_cache[1][dev.id] = { name: ip };
                    changed = true;
                }
                if (Array.isArray(alias)) {
                    if (!_this._name_cache[2][dev.id]) {
                        _this._name_cache[2][dev.id] = {};
                    }
                    for (var a in _this._name_cache[2][dev.id]) {
                        var found = false;
                        for (var i = 0; i < alias.length; i++) {
                            if (alias[a]) {
                                var found = true;
                                break;
                            }
                        }
                        if (!found) {
                            delete _this._name_cache[2][dev.id][a];
                            changed = true;
                        }
                    }
                    for (var i = 0; i < alias.length; i++) {
                        if (_this._name_cache[2][dev.id][alias[i]] != ip) {
                            _this._name_cache[2][dev.id][alias[i]] = ip;
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
        this._remove_name = function (dev, cb) {
            cb = cb || (function () {
            });
            intoQueue("dhcp_operation", function (c) {
                delete _this._name_cache[0][dev.id];
                delete _this._name_cache[1][dev.id];
                delete _this._name_cache[2][dev.id];
                Core.Router.Network.dnsmasq.SIGHUP_Update(c);
            }, cb);
        };
        this.match = function (dev, delta, cb) {
            return cb(undefined, !!dev.bus.data.Lease);
        };
        this.attach = function (dev, delta, matchResult, cb) {
            if (!dev.bus.data.Lease) {
                return cb(new Error("Lease is missing"), undefined);
            }
            else {
                _this._update_name(dev, function () {
                });
                cb(undefined, { valid: true });
            }
        };
        this.change = function (dev, delta, cb) {
            if (!dev.bus.data.Lease) {
                _this._remove_name(dev, function () {
                });
            }
            else {
                _this._update_name(dev, function () {
                });
            }
            return cb(undefined, { valid: true });
        };
        this.detach = function (dev, delta, cb) {
            _this._remove_name(dev, function () {
            });
            return cb(undefined, { valid: true });
        };
        this.load = function (cb) {
            Core.Router.Network.dnsmasq.Hosts[_this._key] = _this._name_cache;
            return cb();
        };
        this.unload = function (cb) {
            return cb();
        };
        this.invoke = function (dev, actionId, params, cb) {
        };
    }
    return NameService;
})();
exports.Instance = new NameService();
