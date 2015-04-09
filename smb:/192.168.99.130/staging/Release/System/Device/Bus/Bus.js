var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Node = require("Node");
var Bus = (function (_super) {
    __extends(Bus, _super);
    function Bus() {
        var _this = this;
        _super.apply(this, arguments);
        this._started = false;
        this.name = function () {
            throw new Error("Cannot Call an Abstract Bus");
        };
        this.start = function (cb) {
            trace(" Start - " + _this.name);
            if (_this._started)
                return cb(new Error("Already Started"));
            _this._start(function (err, result) {
                if (err)
                    return cb(err);
                _this._started = true;
                return cb(err, result);
            });
        };
        this._start = function (cb) {
            throw new Error("Abstract Bus");
        };
        this._stop = function (cb) {
            throw new Error("Abstract Bus");
        };
        this.stop = function (cb) {
            warn(" Stop - " + _this.name);
            if (!_this._started)
                return cb(new Error("Not yet Started"));
            _this.stop(function (err, result) {
                if (err)
                    return cb(err);
                _this._started = false;
                return cb(err, result);
            });
        };
        this._on_device = function (dev) {
            dev.name = _this.name();
            dev.stamp = Date.now();
            if (dev.hwaddr) {
                dev.hwaddr = dev.hwaddr.toLowerCase();
            }
            _this.emit("device", dev);
        };
        this._on_drop = function (dev) {
            dev.name = _this.name();
            dev.total_uptime = (dev.total_uptime !== undefined ? dev.total_uptime : 0) + Date.now() - dev["stamp"];
            if (dev.hwaddr) {
                dev.hwaddr = dev.hwaddr.toLowerCase();
            }
            _this.emit("drop", dev);
        };
    }
    return Bus;
})(Node.events.EventEmitter);
module.exports = Bus;
