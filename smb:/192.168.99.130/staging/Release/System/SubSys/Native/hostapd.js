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
var path = require("path");
(function (ACL_TYPE) {
    ACL_TYPE[ACL_TYPE["ACCEPT_UNLESS_DENY"] = 0] = "ACCEPT_UNLESS_DENY";
    ACL_TYPE[ACL_TYPE["DENY_UNLESS_ACCEPT"] = 1] = "DENY_UNLESS_ACCEPT";
})(exports.ACL_TYPE || (exports.ACL_TYPE = {}));
var ACL_TYPE = exports.ACL_TYPE;
(function (_80211_BASE) {
    _80211_BASE[_80211_BASE["B"] = -1] = "B";
    _80211_BASE[_80211_BASE["G"] = 0] = "G";
    _80211_BASE[_80211_BASE["N"] = 1] = "N";
    _80211_BASE[_80211_BASE["A"] = 2] = "A";
})(exports._80211_BASE || (exports._80211_BASE = {}));
var _80211_BASE = exports._80211_BASE;
(function (RX_SPATIALSTREAM) {
    RX_SPATIALSTREAM[RX_SPATIALSTREAM["NONE"] = 0] = "NONE";
    RX_SPATIALSTREAM[RX_SPATIALSTREAM["SINGLE"] = 1] = "SINGLE";
    RX_SPATIALSTREAM[RX_SPATIALSTREAM["DUAL"] = 2] = "DUAL";
    RX_SPATIALSTREAM[RX_SPATIALSTREAM["TRIPLE"] = 3] = "TRIPLE";
})(exports.RX_SPATIALSTREAM || (exports.RX_SPATIALSTREAM = {}));
var RX_SPATIALSTREAM = exports.RX_SPATIALSTREAM;
(function (TX_SPATIALSTREAM) {
    TX_SPATIALSTREAM[TX_SPATIALSTREAM["NONE"] = 0] = "NONE";
    TX_SPATIALSTREAM[TX_SPATIALSTREAM["SINGLE"] = 1] = "SINGLE";
})(exports.TX_SPATIALSTREAM || (exports.TX_SPATIALSTREAM = {}));
var TX_SPATIALSTREAM = exports.TX_SPATIALSTREAM;
var ConfigBase = (function () {
    function ConfigBase() {
        this.Auto_SSID = true;
        this.Logger = {
            System: -1,
            System_level: 2,
            StdOut: -1,
            StdOut_level: 2
        };
        this.Base = 1 /* N */;
        this.Channel = 1;
        this.MaxStations = 255;
        this.MacAddressControl = 0 /* ACCEPT_UNLESS_DENY */;
        this.BSSID = undefined;
        this.HT_Capatability = {
            HT40: true,
            DSSS_CCK_40: true,
            TX_STBC: 1 /* SINGLE */,
            RX_STBC: 1 /* SINGLE */
        };
        this.BroadcastSSID = true;
        this.Password = "";
        this.BSS = {};
    }
    return ConfigBase;
})();
exports.ConfigBase = ConfigBase;
function CfgString(conf, dev, ctrl_sock, mac_accp, mac_deny) {
    var newconf = "";
    var line = "\n";
    newconf += "interface=" + conf.Dev + line;
    if (conf.Logger) {
        newconf += "logger_syslog=" + conf.Logger.System + line;
        newconf += "logger_syslog_level=" + conf.Logger.System_level + line;
        newconf += "logger_stdout=" + conf.Logger.StdOut + line;
        newconf += "logger_stdout_level=" + conf.Logger.StdOut_level + line;
    }
    switch (conf.Base) {
        case 2 /* A */:
            newconf += "wmm_enabled=1" + line;
            newconf += "ieee80211ac=1" + line;
            newconf += "hw_mode=a" + line;
            break;
        case -1 /* B */:
            newconf += "hw_mode=b" + line;
            break;
        case 0 /* G */:
            newconf += "hw_mode=g" + line;
            break;
        case 1 /* N */:
            newconf += "wmm_enabled=1" + line;
            newconf += "ieee80211n=1" + line;
            newconf += "hw_mode=g" + line;
            break;
    }
    newconf += "ssid=" + conf.SSID + line;
    newconf += "utf8_ssid=1" + line;
    newconf += "ignore_broadcast_ssid=" + (conf.BroadcastSSID ? '0' : '1') + line;
    newconf += "auth_algs=1" + line;
    newconf += conf.BSSID ? conf.BSSID : "";
    newconf += "channel=" + conf.Channel + line;
    newconf += "max_num_sta=" + conf.MaxStations + line;
    newconf += "macaddr_acl=" + conf.MacAddressControl + line;
    newconf += "ctrl_interface=" + ctrl_sock + line;
    newconf += "ctrl_interface_group=0" + line;
    if (conf.Password) {
        newconf += "wpa=2" + line;
        newconf += "wpa_key_mgmt=WPA-PSK" + line;
        newconf += "rsn_pairwise=TKIP CCMP" + line;
        newconf += "wpa_passphrase=" + conf.Password + line;
    }
    for (var _dev in conf.BSS) {
        if (!has(conf.BSS, _dev))
            continue;
        newconf += "bss=" + _dev + line;
        newconf += "ssid=" + conf.BSS[_dev].SSID + line;
        if (conf.BSS[_dev].Password) {
            newconf += "wpa=2" + line;
            newconf += "wpa_key_mgmt=WPA-PSK" + line;
            newconf += "rsn_pairwise=TKIP CCMP" + line;
            newconf += "wpa_passphrase=" + conf.Password + line;
        }
    }
    newconf += "accept_mac_file=" + mac_accp + line;
    newconf += "deny_mac_file=" + mac_deny + line;
    warn("WARNING - HTCAP NOT IMPLEMENTED");
    return newconf;
}
var CtrlInterface = (function (_super) {
    __extends(CtrlInterface, _super);
    function CtrlInterface(dev, sock_loc) {
        var _this = this;
        _super.call(this);
        this.sock_loc = sock_loc;
        this._command_stack = [];
        this._concheck = 0;
        this._sta_recur = function (curSTA, accuresult, maincallback) {
            if (curSTA.trim() === "FAIL" || curSTA.trim() === "") {
                maincallback(null, accuresult);
            }
            else {
                var sp = curSTA.split('\n');
                var mac = sp[0];
                accuresult.push({
                    mac: mac,
                    STA: curSTA
                });
                _this.STA_NEXT(mac, function (err, result) {
                    _this._sta_recur(result, accuresult, maincallback);
                });
            }
        };
        this.ALL_STA = function (callback) {
            _this.STA_FIRST(function (err, result) {
                _this._sta_recur(result, [], callback);
            });
        };
        this.STA_FIRST = function (callback) {
            _this._cmd("STA-FIRST", callback);
        };
        this.STA_NEXT = function (mac, callback) {
            _this._cmd("STA-NEXT " + mac, callback);
        };
        this.STA = function (mac, callback) {
            _this._cmd("STA " + mac, callback);
        };
        this.MIB = function (callback) {
            _this._cmd("MIB", callback);
        };
        this.NEW_STA = function (mac, callback) {
            _this._cmd("NEW_STA " + mac, callback);
        };
        this.DEAUTHENTICATE = function (mac, callback) {
            _this._cmd("DEAUTHENTICATE " + mac, callback);
        };
        this.DISASSOCIATE = function (mac, callback) {
            info("DEAUTH:" + mac);
            _this._cmd("DISASSOCIATE " + mac, callback);
        };
        this.PING = function (callback) {
            _this._cmd("PING", callback);
        };
        this._pingCallback = function (err, result) {
        };
        this._cmd = function (cmd, callback) {
            if (_this._callback_atom || _this._command_stack.length > 0) {
                _this._command_stack.push({
                    cb: callback,
                    cmd: cmd
                });
            }
            else {
                _this._exec(cmd, callback);
            }
        };
        this._exec = function (cmd, callback) {
            _this._callback_atom = callback;
            var buf = new Buffer(cmd);
            _this._client.send(buf, 0, buf.length, _this._loc);
        };
        this._onrawdata = function (buf, rinfo) {
            var data = buf.toString().trim();
            _this._result_atom += data;
            if (data.substr(0, 3) === "<3>") {
                if (_this._prevevent !== data) {
                    var d = data.substr(3).split(' ');
                    _this._prevevent = data;
                    _this.emit(CtrlInterface.EVENT, d[0], d[1]);
                }
            }
            else {
                if (!_this.Connected && _this._result_atom === "OK") {
                    trace("Probe Injected");
                    clearTimeout(_this._gtimer);
                    _this._gtimer = setInterval(_this._guard, 5000);
                    _this.Connected = true;
                    _this.emit(CtrlInterface.CONNECT);
                }
                else if (_this.Connected && _this._callback_atom) {
                    _this._callback_atom(null, _this._result_atom);
                }
                if (_this._command_stack.length == 0) {
                    _this._callback_atom = undefined;
                }
                else {
                    var next = _this._command_stack.pop();
                    _this._exec(next.cmd, next.cb);
                }
            }
            _this._result_atom = "";
            _this._concheck = 0;
        };
        this._guard = function () {
            if (!_this.Connected || _this._concheck > 3) {
                if (_this.Connected) {
                    _this.emit(CtrlInterface.DISCONNECT);
                    clearInterval(_this._gtimer);
                    _this._gtimer = setInterval(_this._guard, 500);
                    warn("Probe Offline - RECONNECTING...");
                    _this.Connected = false;
                }
                _this._concheck = 0;
                if (_this._client) {
                    try {
                        _this._client.close();
                    }
                    catch (e) {
                    }
                }
                delete _this._client;
                try {
                    var unix = require("unix-dgram");
                    var attach = new Buffer('ATTACH');
                    var client = unix.createSocket('unix_dgram', _this._onrawdata);
                    if (fs.existsSync(_this._loc)) {
                        fs.unlinkSync(_this._loc);
                    }
                    client.bind(_this._loc);
                    client.on('error', function () {
                    });
                    client.send(attach, 0, attach.length, _this.sock_loc);
                    _this._client = client;
                }
                catch (e) {
                    warn("Ctrl Error.. ");
                }
            }
            else {
                _this.PING(_this._pingCallback);
                _this._concheck += 1;
            }
        };
        this.Dev = dev;
        this._loc = getSock(UUIDstr());
    }
    CtrlInterface.prototype.start = function () {
        clearInterval(this._gtimer);
        this._gtimer = setInterval(this._guard, 1000);
    };
    CtrlInterface.prototype.stop = function () {
        clearInterval(this._gtimer);
    };
    CtrlInterface.prototype.Destroy = function () {
        clearInterval(this._gtimer);
        if (this._client) {
            try {
                this._client.close();
            }
            catch (e) {
            }
        }
    };
    CtrlInterface.CONNECT = "connect";
    CtrlInterface.DISCONNECT = "disconnect";
    CtrlInterface.EVENT = "event";
    return CtrlInterface;
})(events.EventEmitter);
exports.CtrlInterface = CtrlInterface;
var hostapd = (function (_super) {
    __extends(hostapd, _super);
    function hostapd(dev) {
        var _this = this;
        _super.call(this, "HOSTAPD_" + dev);
        this.MAC_Accept = {};
        this.MAC_Deny = {};
        this._path_conf = getSock(UUIDstr());
        this._path_accp = getSock(UUIDstr());
        this._path_deny = getSock(UUIDstr());
        this._path_sock = getSock(UUIDstr());
        this.Apply = function (forever) {
            if (forever === void 0) { forever = true; }
            _this.Start(forever);
        };
        this.Dev = dev;
    }
    Object.defineProperty(hostapd.prototype, "Dev", {
        get: function () {
            return this._dev;
        },
        set: function (dev) {
            if (dev !== this._dev) {
                this._dev = dev;
                if (this.Ctrl) {
                    this.Ctrl.stop();
                    this.Ctrl.Destroy();
                    this.Ctrl.removeAllListeners();
                }
                this.Config = new ConfigBase();
                this.Config.Dev = dev;
                this.Ctrl = new CtrlInterface(dev, path.join(this._path_sock, dev));
                if (this.Process) {
                    _super.prototype.Stop.call(this, true);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    hostapd.prototype.obj_to_strlst = function (arr) {
        var data = "";
        for (var p in arr) {
            data += p + "\r\n";
        }
        data = data.trim();
        return data;
    };
    hostapd.prototype.Start = function (forever) {
        var _this = this;
        if (forever === void 0) { forever = true; }
        if (!this.IsChoking()) {
            this.Ctrl.start();
            var conf = CfgString(this.Config, this._dev, this._path_sock, this._path_accp, this._path_deny);
            var accp = this.obj_to_strlst(this.MAC_Accept);
            var deny = this.obj_to_strlst(this.MAC_Deny);
            var changed = false;
            if (didChange(this._path_conf, conf)) {
                changed = true;
                if (fs.existsSync(this._path_conf) && fs.unlinkSync(this._path_conf))
                    ;
                fs.writeFileSync(this._path_conf, CfgString(this.Config, this._dev, this._path_sock, this._path_accp, this._path_deny));
            }
            if (didChange(this._path_accp, accp)) {
                changed = true;
                if (fs.existsSync(this._path_accp) && fs.unlinkSync(this._path_accp))
                    ;
                fs.writeFileSync(this._path_accp, accp);
            }
            if (didChange(this._path_deny, deny)) {
                changed = true;
                if (fs.existsSync(this._path_deny) && fs.unlinkSync(this._path_deny))
                    ;
                fs.writeFileSync(this._path_deny, deny);
            }
            if (this.Process) {
                if (changed) {
                    this.Process.kill("SIGHUP");
                    info("OK");
                    _super.prototype.Start.call(this, forever);
                }
                else {
                    info("No change, skipped");
                }
            }
            else {
                killall("hostapd", function () {
                    _this.Process = child_process.spawn("hostapd", [_this._path_conf]);
                    _this.Process.stdout.on("data", function (data) {
                        info(data.toString());
                    });
                    info("OK");
                    _super.prototype.Start.call(_this, forever);
                });
            }
        }
    };
    hostapd.prototype.OnChoke = function () {
        var _this = this;
        _super.prototype.OnChoke.call(this);
        info("Killing all HostAPD processes");
        this.Process.removeAllListeners();
        killall("hostapd", function () {
            _this.Process = undefined;
            info("Done, waiting for recall");
            _this.Choke_Timer = setTimeout(function () {
                _this.ClearChoke();
                _this.Start();
            }, 5000);
        });
        return true;
    };
    return hostapd;
})(Process);
exports.hostapd = hostapd;
