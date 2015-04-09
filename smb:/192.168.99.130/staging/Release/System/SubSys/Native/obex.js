var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Process = require("./Process");
var child_process = require("child_process");
var events = require("events");
var fs = require("fs");
var net = require("net");
var bluez = require("./bluez");
var ObexpushObject = (function (_super) {
    __extends(ObexpushObject, _super);
    function ObexpushObject(Properties, socket) {
        var _this = this;
        _super.call(this);
        this.Properties = Properties;
        this.socket = socket;
        this._act = false;
        this.Accept = function () {
            if (!_this._act) {
                _this._act = true;
                _this.socket.write("OK\n");
            }
        };
        this.Decline = function () {
            if (!_this._act) {
                _this._act = true;
                _this.socket.end();
                _this.socket.removeAllListeners();
            }
        };
    }
    return ObexpushObject;
})(events.EventEmitter);
exports.ObexpushObject = ObexpushObject;
var Obexpushd = (function (_super) {
    __extends(Obexpushd, _super);
    function Obexpushd() {
        var _this = this;
        _super.call(this, "Obexpushd");
        this.Channel = 9;
        this.Iface = CONF.DEV.BLUETOOTH.DEV_HCI;
        this._on_conn_ = function (client) {
            var obex = undefined;
            var id = UUIDstr();
            client.on("data", function (d) {
                if (!obex) {
                    var c = d.toString().split('\n');
                    var obj = {};
                    for (var i = 0; i < c.length; i++) {
                        if (c[i].trim().length && c[i].split(":").length) {
                            if (c[i].split(":")[0] !== "From") {
                                obj[c[i].split(":")[0]] = c[i].split(":")[1].trim();
                            }
                            else {
                                obj[c[i].split(":")[0]] = c[i].substr(5).trim();
                            }
                        }
                    }
                    if (!obj.From || !obj.Length || !obj.Name) {
                        client.removeAllListeners("data");
                        client.removeAllListeners("end");
                        return client.end();
                    }
                    else {
                        obj.From = obj.From.split("[")[1].split("]")[0];
                        obj.Length = parseInt(obj.Length);
                        obex = new ObexpushObject(obj, client);
                        _this.emit("connection", obex);
                    }
                }
                else {
                    obex.emit("data", d);
                }
            });
            var done = function () {
                obex.emit("end");
                client.removeAllListeners("data");
                client.removeAllListeners("end");
            };
            var error = function (e) {
                obex.emit("error", e);
                client.removeAllListeners("data");
                client.removeAllListeners("end");
            };
            client.on("error", error);
            client.on("end", done);
            client.on("close", done);
        };
        this.Apply = function (forever) {
            if (forever === void 0) { forever = true; }
            _this.Start(forever);
        };
        this._lnkpath = getSock(UUIDstr());
        this._sockpath = getSock(UUIDstr());
        this._script = "socat UNIX-CONNECT:" + this._sockpath + " - ";
        this.server = net.createServer(this._on_conn_);
        this.server.listen(this._sockpath);
    }
    Obexpushd.prototype.Start = function (forever) {
        var _this = this;
        if (forever === void 0) { forever = true; }
        async.series([
            exec.bind(null, "rm -rf " + this._lnkpath),
            fs.writeFile.bind(null, this._lnkpath, this._script),
            exec.bind(null, "chmod 777 " + this._lnkpath)
        ], function () {
            killall("obexpushd", function () {
                _this.Process = child_process.spawn("obexpushd", [
                    '-n',
                    '-B',
                    _this.Iface + ":" + _this.Channel,
                    '-s',
                    _this._lnkpath
                ]);
                info("OK");
                _super.prototype.Start.call(_this, forever);
            });
        });
    };
    Obexpushd.prototype.OnChoke = function () {
        var _this = this;
        _super.prototype.OnChoke.call(this);
        info("Killing all OBEX processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall("obexpushd", function () {
            info("Done, waiting for recall");
            var _try = function () {
                clearTimeout(_this.Choke_Timer);
                if (bluez.Bluez.Instance && bluez.Bluez.Instance.Process) {
                    _this.ClearChoke();
                    _this.Start();
                }
                else {
                    _this.Choke_Timer = setTimeout(_try, 2000);
                }
            };
            _this.Choke_Timer = setTimeout(_try, 2000);
        });
        return true;
    };
    return Obexpushd;
})(Process);
exports.Obexpushd = Obexpushd;
