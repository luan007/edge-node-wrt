var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");
var Tracker = (function (_super) {
    __extends(Tracker, _super);
    function Tracker() {
        var _this = this;
        _super.apply(this, arguments);
        this.cache = {};
        this.Exist = function (port) {
            return _this.cache.hasOwnProperty(port);
        };
        this.List = function () {
            return _this.cache;
        };
        this.ListByOwner = function (owner) {
            var k = Object.keys(_this.cache);
            var o = {};
            for (var i = 0; i < k.length; i++) {
                if (_this.cache[k[i]].Owner === owner) {
                    o[k[i]] = _this.cache[k[i]];
                }
            }
            return o;
        };
        this.Get = function (id) {
            return _this.cache[id];
        };
        this.Assign = function (item, cb) {
            if (!_this.Exist(item.Id)) {
                _this.emit("assign", item);
                _this.cache[item.Id] = item;
                return cb(undefined, item);
            }
            else if ((item.Priority <= _this.cache[item.Id].Priority && item.Owner !== _this.cache[item.Id].Owner) || (item.Priority < _this.cache[item.Id].Priority && item.Owner == _this.cache[item.Id].Owner)) {
                return cb(new Error("Trying to replace an port with equal or higher priority :("));
            }
            else {
                _this.Release(item.Id, function (err) {
                    if (err)
                        return cb(err);
                    _this.cache[item.Id] = item;
                    return cb(undefined, item);
                });
            }
        };
        this.Release = function (id, cb) {
            var p = _this.cache[id];
            if (!p)
                return cb();
            else if (!_this.cache[id].Release) {
                return cb(new Error("This port is not removable"));
            }
            else {
                _this.cache[id].Release(function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    else {
                        _this.emit("release", p);
                        delete _this.cache[id];
                        return cb();
                    }
                });
            }
        };
        this.ReleaseByOwner = function (owner, cb) {
            var lst = _this.ListByOwner(owner);
            async.each(Object.keys(lst), function (id, cb) {
                _this.Release(lst, cb);
            }, cb);
        };
    }
    return Tracker;
})(events.EventEmitter);
exports.Tracker = Tracker;
