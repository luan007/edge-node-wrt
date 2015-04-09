var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Bus = require("./Bus");
var Bluetooth = (function (_super) {
    __extends(Bluetooth, _super);
    function Bluetooth(BluezInstance) {
        var _this = this;
        _super.call(this);
        this.BluezInstance = BluezInstance;
        this._mac_list = {};
        this.name = function () {
            return "BLUETOOTH";
        };
        this._on_device_disappear = function (mac) {
            mac = mac.toLowerCase();
            setTask("BLUETOOTH_DROP_" + mac, function () {
                _this._on_drop({
                    hwaddr: mac
                });
                _this._mac_list[mac] = undefined;
            }, CONF.BLUETOOTH_DROPWAIT);
        };
        this._on_device_appear = function (mac) {
            if (!mac)
                return warn(" Invalid MAC - Skipped ");
            mac = mac.toLowerCase();
            clearTask("BLUETOOTH_DROP_" + mac);
            if (_this._mac_list[mac]) {
                _this._on_device({
                    hwaddr: mac,
                    data: {
                        data: _this.BluezInstance.Get(mac).Properties
                    }
                });
            }
            else {
                var baseProperty = _this.BluezInstance.Get(mac).Properties;
                _this._mac_list[mac] = 1;
                _this._on_device({
                    hwaddr: mac,
                    data: baseProperty
                });
            }
            setTask("BLUETOOTH_LIFE_" + mac, function () {
                warn("Force Dropping " + mac + " - MAXTIME PASSED");
                _this._on_device_disappear(mac);
            }, CONF.BLUETOOTH_MAXLIFE);
        };
        this.drop_all = function () {
            for (var t in _this._mac_list) {
                trace("Gracfully Removing " + t);
                _this._on_device_disappear(t);
            }
        };
        this._start = function (cb) {
            _this._mac_list = {};
            _this.BluezInstance.on("exit", _this.drop_all);
            _this.BluezInstance.on("stop", _this.drop_all);
            _this.BluezInstance.on("Found", function (mac) {
                _this._on_device_appear(mac);
            });
            _this.BluezInstance.on("Lost", function (mac) {
                _this._on_device_disappear(mac);
            });
            cb();
        };
        this._stop = function (cb) {
            _this.drop_all();
            _this.BluezInstance.removeAllListeners();
            cb();
        };
    }
    return Bluetooth;
})(Bus);
module.exports = Bluetooth;
