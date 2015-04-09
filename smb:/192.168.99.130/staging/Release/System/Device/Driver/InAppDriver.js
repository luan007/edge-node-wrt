var InAppDriver = (function () {
    function InAppDriver(App, InApp_DriverId, TargetBuses, Interest) {
        var _this = this;
        this.App = App;
        this.InApp_DriverId = InApp_DriverId;
        this.TargetBuses = TargetBuses;
        this.Interest = Interest;
        this.Switch = true;
        this.Loaded = false;
        this.interest = function () {
            return _this.Interest;
        };
        this.id = function () {
            return "App_" + _this.App.App.uid + ":" + _this.InApp_DriverId;
        };
        this.name = function () {
            return _this.App.App.name + " - " + _this.InApp_DriverId;
        };
        this.status = function () {
            return (_this.Loaded && _this.Switch && _this.App && _this.App.IsRunning()) ? 1 : 0;
        };
        this.match = function (dev, delta, cb) {
            if (!_this.status())
                return cb(new Error("Driver is Offline"));
            _this.App.API.Driver.Match(_this.InApp_DriverId, dev, cb);
        };
        this.attach = function (dev, delta, matchResult, cb) {
            if (!_this.status())
                return cb(new Error("Driver is Offline"));
            _this.App.API.Driver.Attach(_this.InApp_DriverId, dev, matchResult, cb);
        };
        this.change = function (dev, delta, cb) {
            if (!_this.status())
                return cb(new Error("Driver is Offline"));
            _this.App.API.Driver.Change(_this.InApp_DriverId, dev, delta, cb);
        };
        this.detach = function (dev, delta, cb) {
            if (!_this.status())
                return cb(new Error("Driver is Offline"));
            _this.App.API.Driver.Detach(_this.InApp_DriverId, dev, cb);
        };
        this.load = function (cb) {
            if (_this.Loaded) {
                return cb(undefined, true);
            }
            else {
                _this.App.API.Driver.Load(_this.InApp_DriverId, function (err, result) {
                    if (!err && result)
                        _this.Loaded = true;
                    return cb(err, _this.Loaded);
                });
            }
        };
        this.unload = function (cb) {
            if (!_this.Loaded) {
                return cb(undefined, true);
            }
            else {
                _this.App.API.Driver.Unload(_this.InApp_DriverId, function (err, result) {
                    if (!err && result)
                        _this.Loaded = false;
                    return cb(err, result);
                });
            }
        };
        this.invoke = function (device, actionId, params, cb) {
            if (!_this.status())
                return cb(new Error("Driver is Offline"));
            _this.App.API.Driver.Invoke(_this.InApp_DriverId, device, actionId, params, cb);
        };
    }
    InAppDriver.prototype.bus = function () {
        return this.TargetBuses;
    };
    return InAppDriver;
})();
module.exports = InAppDriver;
