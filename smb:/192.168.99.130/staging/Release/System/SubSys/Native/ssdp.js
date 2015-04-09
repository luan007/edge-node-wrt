var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ssdp = require('node-ssdp');
var Server = ssdp.Server;
var express = require("express");
var events = require("events");
var Client = ssdp.Client;
var __p = Client.prototype._notify;
Client.prototype._notify = function () {
    __p.apply(this, arguments);
    arguments[0].NTS && this.emit('m', arguments[1], 200, arguments[2], arguments[0].NTS.toLowerCase().split(':')[1]);
};
var _ssdp_Browser = (function (_super) {
    __extends(_ssdp_Browser, _super);
    function _ssdp_Browser() {
        var _this = this;
        _super.call(this);
        this.Cache = {};
        this.watch_addr = {};
        this.detected = function (headers, statusCode, rinfo, kind) {
            if (kind === void 0) { kind = 'alive'; }
            if (!(headers && rinfo && kind && rinfo.address && headers.USN))
                return;
            if (!_this.Cache[rinfo.address])
                _this.Cache[rinfo.address] = {};
            switch (kind) {
                case "alive":
                    _this.Cache[rinfo.address][headers.USN] = headers;
                    _this.emit("serviceUp", rinfo.address, headers);
                    if (_this.watch_addr[rinfo.address]) {
                        _this.watch_addr[rinfo.address][0](headers, _this.Cache[rinfo.address]);
                    }
                    break;
                case "byebye":
                    delete _this.Cache[rinfo.address][headers.USN];
                    _this.emit("serviceDown", rinfo.address, headers);
                    if (_this.watch_addr[rinfo.address]) {
                        _this.watch_addr[rinfo.address][1](headers, _this.Cache[rinfo.address]);
                    }
                    break;
                case "update":
                case "notify":
                    _this.Cache[rinfo.address][headers.USN] = headers;
                    _this.emit("serviceUp", rinfo.address, headers);
                    if (_this.watch_addr[rinfo.address]) {
                        _this.watch_addr[rinfo.address][0](headers, _this.Cache[rinfo.address]);
                    }
                    break;
                default:
                    break;
            }
        };
        this.Start = function () {
            info("Starting SSDP Browser");
            _this.client.on("m", _this.detected);
            _this.client.on("response", _this.detected);
            _this.client.search('ssdp:all');
        };
        this.Stop = function () {
            _this.client.removeAllListeners();
        };
        info("Initializing SSDP Browser");
        this.client = new Client();
        this.Start();
    }
    _ssdp_Browser.prototype.Watch = function (address, event_add, event_lost) {
        this.watch_addr[address] = [event_add, event_lost];
    };
    _ssdp_Browser.prototype.Unwatch = function (address) {
        delete this.watch_addr[address];
    };
    return _ssdp_Browser;
})(events.EventEmitter);
var defaults = {
    desc: "",
    modelName: MACHINE.ModelName,
    versionMajor: MACHINE.Major,
    versionMinor: MACHINE.Minor,
    friendlyName: MACHINE.ModelName,
    manufacturer: "EmergeLabs",
    manufacturerUrl: "http://emerge.cc",
    serialNumber: MACHINE.Serial,
    deviceType: "urn:schemas-upnp-org:device:InternetGatewayDevice:1",
    modelNumber: MACHINE.ModelNumber,
    modelUrl: MACHINE.ModelUrl,
    presentationUrl: MACHINE.DefaultUrl
};
var upnp_template = '<?xml version="1.0" encoding="UTF-8"?>\n' + '<root xmlns="urn:schemas-upnp-org:device-1-0"><specVersion><major>__{{versionMajor}}__</major><minor>__{{versionMinor}}__</minor></specVersion><device><deviceType>__{{deviceType}}__</deviceType><friendlyName>edge</friendlyName><manufacturer>__{{manufacturer}}__</manufacturer><manufacturerURL>__{{manufacturerUrl}}__</manufacturerURL><modelDescription>__{{desc}}__</modelDescription><modelName>__{{modelName}}__</modelName><modelNumber>__{{modelNumber}}__</modelNumber><modelURL>__{{modelUrl}}__</modelURL><serialNumber>__{{serialNumber}}__</serialNumber><UDN>__{{udn}}__</UDN><presentationURL>__{{presentationUrl}}__</presentationURL></device></root>';
function generateUPnPresp(uuid, my) {
    var now = upnp_template;
    for (var i in defaults) {
        var c = defaults[i];
        if (my[i] !== undefined) {
            c = my[i];
        }
        now = now.replace("__{{" + i + "}}__", c);
    }
    now = now.replace("__{{udn}}__", uuid);
    if (CONF.IS_DEBUG && CONF.SSDP_DEBUG) {
        trace(now);
    }
    return now;
}
var server_prefix = "http://wifi.network:" + CONF.SSDP_PORT + "/";
var generic_server = express();
var handled = {};
generic_server.get("*", function (req, res) {
    if (req.path[req.path.length - 1] == "/")
        req.path = req.path.substr(0, req.path.length - 1);
    var t = /[^/]+$/.exec(req.path);
    if (CONF.IS_DEBUG && CONF.SSDP_DEBUG) {
        trace(t);
    }
    if (!t)
        return res.status(404);
    var q = t[0].toLowerCase();
    if (!handled[q] || !handled[q].Record) {
        return res.status(404);
    }
    else {
        res.contentType("xml");
        return res.send(200, generateUPnPresp(handled[q].Opt.udn, handled[q].Record));
    }
});
var SSDP_Server = (function () {
    function SSDP_Server(record, opts) {
        var _this = this;
        this._server = undefined;
        this.Start = function () {
            if (_this._server) {
                _this._server.stop();
            }
            _this._server = new Server(_this.Opt);
            _this._server.addUSN("upnp:rootdevice");
            _this._server.addUSN(_this.Record.deviceType ? _this.Record.deviceType : defaults.deviceType);
            if (_this.Location) {
                handled[_this.Location.toLowerCase()] = _this;
            }
            _this._server.start();
        };
        this.Stop = function () {
            if (_this._server) {
                _this._server.stop();
                _this._server = undefined;
            }
            if (_this.Location) {
                delete handled[_this.Location.toLowerCase()];
            }
        };
        var o = opts ? opts : {};
        o.udn = o.udn != undefined ? o.udn : "uuid:" + UUIDstr(false);
        if (!o.location) {
            this.Location = UUIDstr();
            o.location = server_prefix + this.Location;
        }
        this.Opt = o;
    }
    return SSDP_Server;
})();
exports.SSDP_Server = SSDP_Server;
exports.SSDP_Browser = new _ssdp_Browser();
function Initialize(cb) {
    generic_server.listen(CONF.SSDP_PORT, cb);
    exports.SSDP_Browser.Start();
}
exports.Initialize = Initialize;
