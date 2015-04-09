var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Bus = require("./Bus");
var Dummy = (function (_super) {
    __extends(Dummy, _super);
    function Dummy() {
        var _this = this;
        _super.apply(this, arguments);
        this.name = function () {
            return "Dummy";
        };
        this.start = function (cb) {
            cb();
            setInterval(function () {
                _this._on_device({
                    hwaddr: "00:00:00:11:22:33",
                    data: {
                        val: Math.random()
                    }
                });
            }, 2000);
        };
        this.stop = function (cb) {
            cb();
        };
    }
    return Dummy;
})(Bus);
module.exports = Dummy;
