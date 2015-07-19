/// <reference path="../global.d.ts" />
var OUI = require('./OUI/OUI');
var OUI_Identifier = (function () {
    function OUI_Identifier() {
        var _this = this;
        this.__find = function (dev, cb) {
            //var t1 = new Date().getTime();
            var _oui_Str = (dev.bus.hwaddr + "").substr(0, 8);
            OUI.OUI_Find(_oui_Str, function (err, result) {
                //var t2 = new Date().getTime();
                //return console.log('OUI total consumed seconds:', (t2 - t1)/1000);
                if (!result) {
                    console.log("OUI Not Found " + _oui_Str);
                    return cb();
                }
                cb(undefined, {
                    actions: {},
                    attributes: {
                        vendor: result
                    },
                    classes: {},
                    aux: {},
                    valid: true
                });
            });
        };
        this.match = function (dev, delta, cb) {
            var matched = dev.bus.hwaddr.length > 8 ? {} : undefined;
            cb(undefined, matched);
        };
        this.attach = function (dev, delta, matchResult, cb) {
            console.log("OUI ATTACH Called");
            _this.__find(dev, cb);
        };
        this.change = function (dev, delta, cb) {
            cb(undefined, undefined);
        };
        this.detach = function (dev, delta, cb) {
            cb(undefined, { valid: true });
        };
        this.load = function (cb) {
            return cb(undefined, true);
        };
        this.unload = function (cb) {
            return cb(undefined, true);
        };
        this.invoke = function (dev, actionId, params, cb) {
            return cb(undefined, true);
        };
    }
    return OUI_Identifier;
})();
exports.Instance = new OUI_Identifier();
