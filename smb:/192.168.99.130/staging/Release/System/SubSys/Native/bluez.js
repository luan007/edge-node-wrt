var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Process = require("./Process");
var child_process = require("child_process");
var dbus = require("dbus-native");
var Bluez = (function (_super) {
    __extends(Bluez, _super);
    function Bluez() {
        var _this = this;
        _super.call(this, "Bluez");
        this.IAgent = {
            name: 'org.bluez.Agent',
            methods: {
                Release: ['', ''],
                Authorize: ['os', 'd'],
                RequestPinCode: ['o', 's'],
                RequestPasskey: ['o', 'u'],
                DisplayPasskey: ['ou', ''],
                RequestConfirmation: ['ou', ''],
                ConfirmModeChange: ['s', ''],
                Cancel: ['', '']
            },
            signals: {},
            properties: {}
        };
        this.GenericPairingAgent = {
            Release: console.log,
            Authorize: console.log,
            RequestPinCode: console.log,
            RequestPasskey: console.log,
            DisplayPasskey: console.log,
            RequestConfirmation: console.log,
            ConfirmModeChange: console.log,
            Cancel: console.log
        };
        this.AudioPairingAgent = {
            Release: console.log,
            Authorize: console.log,
            RequestPinCode: console.log,
            RequestPasskey: console.log,
            DisplayPasskey: console.log,
            RequestConfirmation: console.log,
            ConfirmModeChange: console.log,
            Cancel: console.log
        };
        this.GenericIface = CONF.DEV.BLUETOOTH.DEV_HCI;
        this.AudioIface = CONF.DEV.BLUETOOTH.DEV_AUD;
        this.agentPath = "/edge/" + UUIDstr();
        this.audioPath = "/edge/" + UUIDstr();
        this.GenericName = "Edge";
        this.AudioName = "Edge-Audio";
        this.GenericScan = "piscan";
        this.AudioScan = "piscan";
        this.GenericPower = true;
        this.AudioPower = true;
        this._scan_timer = undefined;
        this._dev_cache = {};
        this.Get = function (addr) {
            if (!addr)
                return undefined;
            return _this._dev_cache[addr.toLowerCase()];
        };
        this._update_property = function (addr, dev) {
            dev.GetProperties(function (err, props) {
                if (err)
                    return;
                props = dbus_magic(props);
                if (!dev.Properties)
                    dev.Properties = props;
                else {
                    delta_add(dev.Properties, props, true);
                }
                _this.emit("Changed", addr);
            });
        };
        this._dev_created = function (obj_path, cb) {
            if (cb === void 0) { cb = function () {
            }; }
            var addr = obj_path.substring(obj_path.length - 17).replace(/_/g, ":").toLowerCase();
            if (!_this._dev_cache[addr]) {
                _this.bus.getInterface("org.bluez", obj_path, "org.bluez.Device", function (err, dev) {
                    if (err)
                        return cb();
                    _this._dev_cache[addr] = dev;
                    _this._dev_cache[addr].Alive = true;
                    _this._update_property(addr, dev);
                    _this.emit("Created", addr);
                    dev.on("PropertyChanged", function (id, data) {
                        data = dbus_magic(data);
                        if (_this._dev_cache[addr].Properties) {
                            _this._dev_cache[addr].Properties.PropertyStamp = Date.now();
                            _this._dev_cache[addr].Properties[id] = data;
                            _this.emit("Changed", addr);
                        }
                        else {
                            _this._update_property(addr, dev);
                        }
                    });
                    return cb();
                });
            }
        };
        this._dev_found = function (adapter, addr, props) {
            addr = addr.toLowerCase();
            props = dbus_magic(props);
            if (!_this._dev_cache[addr]) {
                adapter.CreateDevice(addr, function () {
                    if (!_this._dev_cache[addr])
                        return;
                    if (!_this._dev_cache[addr].Properties) {
                        _this._dev_cache[addr].Properties = props;
                    }
                    else {
                        _this._dev_cache[addr].Properties.RSSIStamp = Date.now();
                        _this._dev_cache[addr].Properties.RSSI = props.RSSI;
                    }
                    _this.emit("Found", addr);
                });
            }
            else {
                _this._dev_cache[addr].Properties = props;
                _this._dev_cache[addr].Alive = true;
                _this._dev_cache[addr].Properties.RSSIStamp = Date.now();
                _this.emit("Found", addr);
            }
        };
        this._dev_disap = function (obj_path) {
            var addr = obj_path.substring(obj_path.length - 17).replace(/_/g, ":").toLowerCase();
            if (_this._dev_cache[addr]) {
                _this._dev_cache[addr].Alive = false;
                _this.emit("Lost", addr);
            }
        };
        this._release_dev = function (obj_path) {
            var addr = obj_path.substring(obj_path.length - 17).replace(/_/g, ":").toLowerCase();
            if (_this._dev_cache[addr]) {
                _this.emit("Removed", addr, _this._dev_cache[addr]);
            }
        };
        this._start_dbus = function (cb) {
            if (cb === void 0) { cb = function (err) {
            }; }
            if (_this.bus)
                return cb();
            _this.bus = dbus.systemBus({ socket: "/var/run/dbus/system_bus_socket" });
            _this.bus.exportInterface(_this.GenericPairingAgent, _this.agentPath, _this.IAgent);
            _this.bus.exportInterface(_this.AudioPairingAgent, _this.audioPath, _this.IAgent);
            _this.bus.getInterface("org.bluez", "/", "org.bluez.Manager", function (err, conn) {
                if (err) {
                    return cb(err);
                }
                conn.FindAdapter(_this.GenericIface, function (err, final) {
                    if (err) {
                        return cb(err);
                    }
                    _this._dev_cache = {};
                    _this.bus.getInterface("org.bluez", final, "org.bluez.Adapter", function (err, adapter) {
                        if (err)
                            return cb(err);
                        adapter.RegisterAgent(_this.agentPath, "DisplayYesNo");
                        conn.FindAdapter(_this.AudioIface, function (err, final) {
                            _this.bus.getInterface("org.bluez", final, "org.bluez.Adapter", function (err, adapter) {
                                adapter.RegisterAgent(_this.audioPath, "DisplayYesNo");
                            });
                        });
                        adapter.GetProperties(function (err, arr) {
                            if (err)
                                return cb(err);
                            var prop = dbus_magic(arr);
                            var d = prop.Devices;
                            var jobs = [];
                            for (var i = 0; i < d.length; i++) {
                                jobs.push(_this._dev_created.bind(null, d[i]));
                            }
                            async.series(jobs, function () {
                                adapter.on("DeviceCreated", _this._dev_created);
                                adapter.on("DeviceFound", _this._dev_found.bind(null, adapter));
                                adapter.on("DeviceDisappeared", _this._dev_disap);
                                adapter.on("DeviceRemoved", _this._release_dev);
                                var curState = 1;
                                adapter.StartDiscovery();
                                info("Start Discovery");
                                _this.emit("dbus_Started");
                                return cb();
                            });
                        });
                    });
                });
            });
        };
        this._stop_dbus = function () {
            if (_this.bus && _this.bus.connection) {
                clearTimeout(_this._scan_timer);
                _this.bus.connection.end();
                _this.bus.connection.removeAllListeners();
                _this.bus = undefined;
                for (var i in _this._dev_cache) {
                    _this._dev_cache[i] = undefined;
                }
                _this.emit("dbus_Stopped");
            }
        };
        this.Apply = function (forever) {
            if (forever === void 0) { forever = true; }
            _this.Start(forever);
        };
        Bluez.Instance = this;
    }
    Bluez.prototype.Start = function (forever) {
        var _this = this;
        if (forever === void 0) { forever = true; }
        var jobs = [
            function (cb) {
                exec("hciconfig  " + _this.GenericIface + " " + (_this.GenericPower ? "up" : "down"), ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.GenericIface + " name " + _this.GenericName, ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.GenericIface + " " + _this.GenericScan, ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.GenericIface + " inqparms 10:2048", ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.GenericIface + " pageparms 20:1024", ignore_err(cb));
            },
            function (cb) {
                exec("sdptool -i " + _this.GenericIface + " add --channel=9 OPUSH", ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.GenericIface + " class 0x950300", ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.GenericIface + " noleadv", ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.AudioIface + " " + (_this.AudioPower ? "up" : "down"), ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.AudioIface + " name " + _this.AudioName, ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.AudioIface + " " + _this.AudioScan, ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.AudioIface + " class 200414", ignore_err(cb));
            },
            function (cb) {
                exec("hciconfig  " + _this.AudioIface + " noleadv", ignore_err(cb));
            },
        ];
        if (this.Process) {
            async.series(jobs, function () {
                info("UPDATE");
            });
        }
        else {
            this._stop_dbus();
            killall("bluetoothd", function () {
                _this.Process = child_process.spawn("bluetoothd", ['-n']);
                setTimeout(function () {
                    async.series(jobs, function () {
                        _this._start_dbus(function () {
                            info("OK");
                            _super.prototype.Start.call(_this, forever);
                        });
                    });
                }, 3000);
            });
        }
    };
    Bluez.prototype.OnChoke = function () {
        var _this = this;
        _super.prototype.OnChoke.call(this);
        info("Killing all Bluetoothd processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        this._stop_dbus();
        killall("bluetoothd", function () {
            info("Done, waiting for recall");
            _this.Choke_Timer = setTimeout(function () {
                _this.ClearChoke();
                _this.Start();
            }, 2000);
        });
        return true;
    };
    return Bluez;
})(Process);
exports.Bluez = Bluez;
