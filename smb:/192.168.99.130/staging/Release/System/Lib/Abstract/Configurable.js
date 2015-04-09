var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Node = require("Node");
var Configurable = (function (_super) {
    __extends(Configurable, _super);
    function Configurable(sub, key) {
        var _this = this;
        if (key === void 0) { key = "_config"; }
        _super.call(this);
        this.sub = sub;
        this.key = key;
        this._config = {};
        this.SubLevel = function () {
            return _this.sub;
        };
        this.Get = function () {
            return _this._config;
        };
        this.Apply = function (config_delta, cb) {
            info(JSON.stringify(config_delta));
            intoQueue("_CONFIG_" + _this.key, function (cb) {
                var _backup = JSON.stringify(_this._config);
                var mod = delta_add_return_changes(_this._config, config_delta, true);
                trace("Applying.. [" + Object.keys(mod).length + "]");
                _this._apply(mod, config_delta, function (err) {
                    if (err) {
                        error(err);
                        _this._config = JSON.parse(_backup);
                        _this.Reload(_backup, function () {
                            warn("Reloading last config..");
                        });
                        cb(err);
                    }
                    else {
                        _this.emit("change", mod);
                        if (_this.sub && _this.key) {
                            return _this.sub.put(_this.key, _this._config, function (err) {
                                if (err)
                                    error(err);
                                else
                                    info("Saved - " + JSON.stringify(_this._config));
                                cb(err, mod);
                            });
                        }
                        else {
                            cb(undefined, mod);
                        }
                        trace("Applied");
                    }
                });
            }, cb);
        };
        this.Reload = function (_default, cb) {
            if (!(_this.sub && _this.key)) {
                return cb();
            }
            _this.sub.get(_this.key, function (err, result) {
                if (!result || err || (CONF.IS_DEBUG && CONF.RELOAD_DEFAULT_CONFIG)) {
                    if (_default) {
                        trace("Data Absent.. going default");
                        return _this.Apply(_default, cb);
                    }
                    else {
                        return cb(err);
                    }
                }
                trace("Config (re)Loaded");
                _this.Apply(result, cb);
            });
        };
        this._apply = function (mod, raw, cb) {
            throw new Error("Virtual Method");
        };
        this.sub = sub;
        this.key = key;
    }
    return Configurable;
})(Node.events.EventEmitter);
exports.Configurable = Configurable;
