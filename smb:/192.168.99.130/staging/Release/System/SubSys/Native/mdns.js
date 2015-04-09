var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var mdns = require('mdns');
var dns = require("dns");
var events = require("events");
var _mdns_Browser = (function (_super) {
    __extends(_mdns_Browser, _super);
    function _mdns_Browser() {
        var _this = this;
        _super.call(this);
        this.manual = {};
        this.Alive = {};
        this.watch_addr = {};
        this.eventProxy = function (event, service) {
            var s = JSON.stringify(service);
            var typeString = mdns.makeServiceType(service.type).toString();
            if (!service.host) {
                return warn("Record is broken, need hostname");
            }
            dns.lookup(service.host, function (err, ip, family) {
                if (err)
                    return warn(err);
                else {
                    info(arguments);
                }
                trace((event ? "+" : "-") + " " + service.type + "@" + ip);
                service.addresses = ip;
                var addrs = service.addresses;
                for (var i = 0; i < addrs.length; i++) {
                    var addr = addrs[i];
                    if (event == 1) {
                        if (!_this.Alive[addr]) {
                            _this.Alive[addr] = {};
                        }
                        if (!_this.Alive[addr][typeString]) {
                            _this.Alive[addr][typeString] = {};
                        }
                        _this.Alive[addr][typeString][s] = service;
                        if (_this.watch_addr[addr]) {
                            _this.watch_addr[addr][0](service, _this.Alive[addr]);
                        }
                    }
                    else if (event == 0) {
                        if (_this.Alive[addr] && _this.Alive[addr][typeString]) {
                            delete _this.Alive[addr][typeString][s];
                            if (Object.keys(_this.Alive[addr][typeString]).length == 0) {
                                delete _this.Alive[addr][typeString];
                                if (Object.keys(_this.Alive[addr]).length == 0) {
                                    delete _this.Alive[addr];
                                }
                            }
                        }
                        if (_this.watch_addr[addr]) {
                            _this.watch_addr[addr][1](service, _this.Alive[addr]);
                        }
                    }
                }
                if (event == 1) {
                    _this.emit("serviceUp", service);
                }
                else if (event == 0) {
                    _this.emit("serviceDown", service);
                }
            });
        };
        this.browseService = function (service) {
            var t = service.type;
            if (!t)
                return;
            var string_ = mdns.makeServiceType(t).toString();
            if (_this.manual[string_])
                return;
            _this.manual[string_] = mdns.createBrowser(t, {
                resolverSequence: [
                    mdns.rst.DNSServiceResolve()
                ]
            });
            _this.manual[string_].on("serviceUp", _this.eventProxy.bind(null, 1));
            _this.manual[string_].on("serviceDown", _this.eventProxy.bind(null, 0));
            _this.manual[string_].on("error", function (err) {
                warn(err);
            });
            _this.manual[string_].start();
            trace("STARTING BROWSER - " + string_);
            return _this.manual[string_];
        };
        this.Start = function () {
            info("Starting MDNS Browser");
            _this.browser.start();
        };
        this.Stop = function () {
            _this.browser.stop();
        };
        info("Initializing MDNS Browser");
        this.browser = mdns.browseThemAll();
        this.browser.on("serviceUp", function (service) {
            _this.browseService(service);
        });
        this.browser.on("error", function (err) {
        });
    }
    _mdns_Browser.prototype.GetServices = function (address) {
        return this.Alive[address];
    };
    _mdns_Browser.prototype.Watch = function (address, event_add, event_lost) {
        this.watch_addr[address] = [event_add, event_lost];
    };
    _mdns_Browser.prototype.Unwatch = function (address) {
        delete this.watch_addr[address];
    };
    return _mdns_Browser;
})(events.EventEmitter);
exports.Browser = new _mdns_Browser();
global.mdns = mdns;
function Initialize(cb) {
    info("Starting..");
    exports.Browser.Start();
    cb();
}
exports.Initialize = Initialize;
