var OUI_Identifier = (function () {
    function OUI_Identifier() {
        this.id = function () {
            return "_OUI_";
        };
        this.interest = function () {
            return {
                stateChange: true
            };
        };
        this.name = function () {
            return "OUI Identifier";
        };
        this.status = function () {
            return 1;
        };
        this.bus = function () {
            return ["WLAN"];
        };
        this.match = function (dev, delta, cb) {
            cb(undefined, dev.bus.hwaddr.length > 8 ? {} : undefined);
        };
        this.attach = function (dev, delta, matchResult, cb) {
            var _oui_Str = (dev.bus.hwaddr + "").substr(0, 8);
            OUI_Find(_oui_Str, function (err, result) {
                if (!result) {
                    fatal("OUI Not Found " + _oui_Str);
                    return cb(undefined, undefined);
                }
                cb(undefined, {
                    actions: {},
                    attributes: {
                        vendor: {
                            name: result,
                            icon: ""
                        }
                    },
                    classes: {},
                    valid: true
                });
            });
        };
        this.change = function (dev, delta, cb) {
            cb(undefined, undefined);
        };
        this.detach = function (dev, delta, cb) {
            cb(undefined, undefined);
        };
        this.load = function (cb) {
            cb();
        };
        this.unload = function (cb) {
            cb();
        };
        this.invoke = function (dev, actionId, params, cb) {
        };
    }
    return OUI_Identifier;
})();
exports.Instance = new OUI_Identifier();
