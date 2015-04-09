var TestDriver = (function () {
    function TestDriver() {
        this.id = function () {
            return "_TEST_DRV_";
        };
        this.interest = function () {
            return {
                match: [
                    {
                        delta: {
                            bus: {
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
                    }
                ],
            };
        };
        this.name = function () {
            return "TestDriver";
        };
        this.status = function () {
            return 1;
        };
        this.bus = function () {
            return ["WLAN"];
        };
        this.match = function (dev, delta, cb) {
            for (var i in dev.bus.data.MDNS) {
                if (i == "_pdl-datastream._tcp.") {
                    trace(i);
                    return cb(undefined, dev.bus.data.MDNS[i]);
                }
            }
            return cb(undefined, undefined);
        };
        this.attach = function (dev, delta, matchResult, cb) {
            info("ATTACH Called");
            var d = matchResult[Object.keys(matchResult)[0]];
            var addr = dev.bus.data.Lease.Address;
            trace(addr + ":" + d.port);
            trace(d.name);
            cb(undefined, {
                actions: {},
                attributes: {},
                classes: {},
                valid: true
            });
        };
        this.change = function (dev, delta, cb) {
            cb(undefined, {
                actions: {},
                attributes: {},
                classes: {},
                valid: true
            });
        };
        this.detach = function (dev, delta, cb) {
        };
        this.load = function (cb) {
            cb();
        };
        this.unload = function (cb) {
        };
        this.invoke = function (dev, actionId, params, cb) {
        };
    }
    return TestDriver;
})();
exports.Instance = new TestDriver();
