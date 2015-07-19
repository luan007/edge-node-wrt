/// <reference path="../global.d.ts" />
var UAParser = require('ua-parser-js');
var parser = new UAParser.UAParser();
var P0FService = (function () {
    function P0FService() {
    }
    P0FService.prototype.match = function (dev, delta, cb) {
        //console.log("------------\n P0f match Called", dev.bus.data);
        cb(undefined, {});
    };
    P0FService.prototype.attach = function (dev, delta, matchResult, cb) {
        console.log("P0f ATTACH Called");
        cb(undefined, { valid: true });
    };
    P0FService.prototype.change = function (dev, delta, cb) {
        var useragent = parser.setUA(dev.bus.data.P0F.ua).getResult();
        var queried = dev.bus.data.P0F.assumption;
        console.log("P0f CHANGE Called");
        var assumption = {
            classes: {},
            actions: {},
            aux: { UserAgent: useragent.ua },
            attributes: {},
            valid: true
        };
        if (useragent.device) {
            if (useragent.device['type'])
                assumption.classes[useragent.device['type']] = '';
            if (useragent.device['model'])
                assumption.attributes['model'] = useragent.device['model'];
            if (useragent.device['vendor'])
                assumption.attributes['vendor'] = useragent.device['vendor'];
        }
        if (useragent.os) {
            if (useragent.os['name'])
                assumption.attributes['os'] = useragent.os['name'];
            if (useragent.os['version'])
                assumption.attributes['os.version'] = useragent.os['version'];
        }
        if (useragent.browser) {
            if (useragent.browser['name'])
                assumption.attributes['browser'] = useragent.browser['name'];
            if (useragent.browser['version'])
                assumption.attributes['browser.version'] = useragent.browser['version'];
        }
        if (useragent.cpu) {
            if (useragent.cpu['architecture'])
                assumption.attributes['cpu'] = useragent.cpu['architecture'];
        }
        if (queried && queried.language) {
            assumption.attributes['os.language'] = queried.language;
        }
        if (Object.keys(assumption.classes).length === 0) {
            if (/Mac OS/gmi.test(useragent.os['name'])) {
                assumption.classes['pc'] = '';
                if (!assumption.attributes['vendor'])
                    assumption.attributes['vendor'] = 'Apple';
                if (!assumption.attributes['model'])
                    assumption.attributes['model'] = 'Mac';
            }
        }
        cb(undefined, assumption);
    };
    P0FService.prototype.detach = function (dev, delta, cb) {
        cb(undefined, { valid: true });
    };
    P0FService.prototype.load = function (cb) {
        return cb(undefined, true);
    };
    P0FService.prototype.unload = function (cb) {
        return cb(undefined, true);
    };
    P0FService.prototype.invoke = function (dev, actionId, params, cb) {
        return cb(undefined, true);
    };
    return P0FService;
})();
exports.Instance = new P0FService();
