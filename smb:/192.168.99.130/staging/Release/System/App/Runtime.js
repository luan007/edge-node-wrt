var Core = require("Core");
var Node = require("Node");
var InAppDriver = require("../Device/Driver/InAppDriver");
var _FAIL_STACK_SIZE = 30;
var _LAUNCH_TIMEOUT = 15000;
var Runtime = (function () {
    function Runtime(runtimeId, app) {
        var _this = this;
        this._process = undefined;
        this._mainsock = getSock(UUIDstr());
        this._webexsock = getSock(UUIDstr());
        this.Strobe_SafeQuit = false;
        this.Driver = {};
        this.DeathHooks = {};
        this.RegisterDeathHook = function (name, func) {
            _this.DeathHooks[name] = func;
        };
        this.ReleaseDeathHook = function (name, func) {
            delete _this.DeathHooks[name];
        };
        this._reset_launch_timeout = function () {
            if (_this._launch_wait_clock !== undefined) {
                clearTimeout(_this._launch_wait_clock);
                _this._launch_wait_clock = undefined;
            }
        };
        this._start_launch_timeout = function () {
            _this._reset_launch_timeout();
            _this._launch_wait_clock = setTimeout(function () {
                warn("Launch Timed out... sorry " + _this.App.name.bold);
                _this._reset_launch_timeout();
                _this.ForceError("Launch Sequence Timeout");
            }, _LAUNCH_TIMEOUT);
        };
        this._push_fail = function (reason, err) {
            error(JSON.stringify(reason));
            _this._status.FailHistory.unshift({
                LaunchTime: _this._status.LaunchTime < 0 ? Date.now() : _this._status.LaunchTime,
                ExitTime: Date.now(),
                Reason: reason
            });
            if (err) {
                _this._status.FailHistory[0].Error = err;
            }
            if (_this._status.FailHistory.length > _FAIL_STACK_SIZE) {
                _this._status.FailHistory.pop();
            }
            _this._status.LaunchTime = -1;
            _this._status.State = -1;
            var avgLife = 0;
            for (var i = 0; i < _this._status.FailHistory.length; i++) {
                var deltaT = _this._status.FailHistory[i].ExitTime - _this._status.FailHistory[i].LaunchTime;
                avgLife += deltaT / _this._status.FailHistory.length;
            }
            _this._status.StabilityRating = Math.min(CONF.APP_TRUST_LIFE, avgLife / 1000 / 60) / CONF.APP_TRUST_LIFE;
            _this._status.PlannedLaunchTime = Date.now() + Math.pow(10, (1 - _this._status.StabilityRating) * CONF.APP_SPAN_SCALER) * 1000 * (_this._status.FailHistory.length / _FAIL_STACK_SIZE) * (_this._status.FailHistory.length / _FAIL_STACK_SIZE);
            fatal(_this.App.name.bold + " * StabilityRating " + (_this._status.StabilityRating * 100 + "%")["yellowBG"].black.bold);
        };
        this._proc_on_exit = function () {
            for (var i in _this.DeathHooks) {
                _this.DeathHooks["i"](_this);
            }
            _this.DeathHooks = {};
            if (_this._status.State == -2)
                return;
            if (!_this.Strobe_SafeQuit) {
                _this._push_fail("Sudden Termination");
            }
            _this._reset_launch_timeout();
            _this._process.removeAllListeners();
            _this._process = undefined;
            _this.Strobe_SafeQuit = false;
            _this.Stop(true);
        };
        this._proc_on_error = function (e) {
            _this._push_fail(e);
            _this.Strobe_SafeQuit = true;
            _this.Stop(true);
        };
        this._on_heartbeat = function (err, deltaT) {
            if (_this._status.State <= 1) {
                return;
            }
            else if (err) {
                _this.ForceError("Heartbeat Error");
            }
            else {
                _this._status.Heartbeat = {
                    DeltaT: deltaT,
                    Sent: Date.now() - deltaT
                };
            }
        };
        this.GetPID = function () {
            return _this._process.pid;
        };
        this.GetProcess = function () {
            return _this._process;
        };
        this.GetAppRootPath = function () {
            return Node.path.join(CONF.APP_BASE_PATH, _this.App.uid);
        };
        this.GetAppDataLn = function () {
            return Node.path.join(CONF.APP_BASE_PATH, _this.App.uid, "Data");
        };
        this.GetAppDataPath = function () {
            return Core.SubSys.FileSystem.IsolatedZone.GetAppDataDir(_this.App.uid);
        };
        this._clean_up = function (cb) {
            trace("Cleaning Up..");
            Core.SubSys.Ports.Tracker.ReleaseByOwner(_this.RuntimeId, function (err, result) {
                if (err)
                    warn(err);
                umount_till_err(_this.GetAppDataLn(), function (err, result) {
                    try {
                        if (Node.fs.existsSync(_this.GetAppDataLn())) {
                            Node.fs.rmdirSync(_this.GetAppDataLn());
                        }
                    }
                    catch (e) {
                        warn("Failed to remove AppData Folder, but that's possibly OK");
                    }
                    try {
                        if (Node.fs.existsSync(_this._mainsock)) {
                            Node.fs.rmdirSync(_this._mainsock);
                        }
                    }
                    catch (e) {
                        warn("Failed to remove MainSocket, but that's possibly OK");
                    }
                    try {
                        if (Node.fs.existsSync(_this._webexsock)) {
                            Node.fs.rmdirSync(_this._webexsock);
                        }
                    }
                    catch (e) {
                        warn("Failed to remove WebSocket, but that's possibly OK");
                    }
                    return cb();
                });
            });
        };
        this._check = function (target_dir, api_salt, cb) {
            if (CONF.IS_DEBUG && CONF.BYPASS_APP_SIGCHECK) {
                warn("!!Sigcheck Bypassed!!");
                return cb(undefined, true);
            }
            try {
                var salt = new Buffer(api_salt, "hex");
                var hash = HashDir(target_dir, salt);
                var snapshot = salt.toString("hex") + hash.toString("hex");
                return cb(undefined, RSA_Verify("App", api_salt, snapshot));
            }
            catch (e) {
                return cb(e, false);
            }
        };
        this._ensure_user = function (cb) {
            Core.SubSys.Native.user.Get(_this.RuntimeId, function (err, user) {
                if (err) {
                    return cb(err, undefined);
                }
                if (!user) {
                    trace("Creating User for Runtime .." + _this.App.name.bold);
                    Core.SubSys.Native.user.Create(_this.RuntimeId, "nogroup", undefined, function (err, result) {
                        if (err) {
                            return (new Error("Cannot Create User"), undefined);
                        }
                        Core.SubSys.Native.user.Get(_this.RuntimeId, function (err, user) {
                            if (err) {
                                return (new Error("Cannot Create User"), undefined);
                            }
                            _this.UserId = user.userId;
                            trace("User Created");
                            return cb(undefined, _this.UserId);
                        });
                    });
                }
                else {
                    _this.UserId = user.userId;
                    return cb(undefined, user.userId);
                }
            });
        };
        this._setup_quota = function (cb) {
            _this.Quota(function (err, quota) {
                if (err)
                    return cb(err);
                _this.Quota(cb, quota);
            });
        };
        this.Start = function () {
            error("WARNING, CHMOD 0711 IS NOT SECURE!!");
            if (_this._status.State == -2) {
                warn("[ SKIP ] App is marked Broken " + _this.App.name.bold);
                return;
            }
            if (_this._process) {
                _this.Stop(false);
            }
            var path = Core.SubSys.FileSystem.IsolatedZone.GetAppDataDir(_this.App.uid);
            async.series([
                _this._clean_up,
                function (cb) {
                    _this._check(_this.GetAppRootPath(), _this.App.appsig.substr(0, 512), function (err, result) {
                        if (err || !result) {
                            _this.Broken();
                        }
                        cb(err, result);
                    });
                },
                _this._ensure_user,
                function (cb) {
                    if (CONF.CODE_WRITE_LOCK) {
                        Core.SubSys.FileSystem.IsolatedZone.SetOwner_Recursive(_this.GetAppRootPath(), _this.RuntimeId, cb);
                    }
                    else {
                        return cb();
                    }
                },
                function (cb) {
                    Core.SubSys.FileSystem.IsolatedZone.SetupAppDataDir(_this.App.uid, _this.RuntimeId, function (err, p) {
                        if (err) {
                            error(err);
                            _this.Broken();
                            return cb(err, undefined);
                        }
                        return cb(undefined);
                    });
                },
                _this._setup_quota,
                function (cb) {
                    Node.fs.mkdir(_this.GetAppDataLn(), ignore_err(cb));
                },
                mount_auto.bind(null, path, _this.GetAppDataLn(), ["--bind"]),
                exec.bind(null, "chown", "root", _this.GetAppRootPath()),
                exec.bind(null, "chmod", "0755", _this.GetAppRootPath()),
                exec.bind(null, "chown", _this.RuntimeId, _this.GetAppDataLn()),
                exec.bind(null, "chmod", "-R", "0755", _this.GetAppDataLn())
            ], function (e, r) {
                if (e) {
                    error(e);
                    return _this.ForceError(e);
                }
                _this._start_launch_timeout();
                trace("Launching " + _this.App.name.bold);
                trace("--with Data Path " + path);
                trace("--with RuntimeId " + _this.RuntimeId.bold);
                _this._status.State = 1;
                _this._status.LaunchTime = -1;
                _this._status.PlannedLaunchTime = -1;
                var env = {
                    target_dir: _this.GetAppRootPath(),
                    api_socket_path: Core.API.Server.GetAPIServer_SockPath(),
                    main_socket: _this._mainsock,
                    webex_socket: _this._webexsock,
                    runtime_id: _this.RuntimeId,
                    api_obj: Core.API.Server.GetAPIJSON()
                };
                env.NODE_PATH = process.env.NODE_PATH;
                trace("--with Env" + "\n" + ('' + JSON.stringify(env)).bold);
                _this._process = Node.child_process.spawn("node", ["./App/Sandbox/Sandbox.js"], {
                    env: env,
                    stdio: CONF.IS_DEBUG ? [process.stdin, process.stdout, 'pipe'] : 'ignore',
                    detached: CONF.DO_NOT_DETACH ? false : true
                });
                trace("Process Started With PID " + (_this._process.pid + "").bold);
                _this._process.on("error", _this._proc_on_error);
                _this._process.on("message", function (e) {
                    _this._push_fail("Error", e);
                    _this.Stop(true);
                });
                _this._process.on("exit", _this._proc_on_exit);
                if (CONF.IS_DEBUG) {
                    _this._process.stderr.on("data", function (data) {
                        error(data.toString());
                    });
                }
            });
        };
        this.Status = function () {
            return _this._status;
        };
        this.Stop = function (restart) {
            if (_this._status.State == -2) {
                warn("[ STOP ] App is marked Broken " + _this.App.name.bold);
                return;
            }
            _this._reset_launch_timeout();
            if (_this.RPC) {
                warn("Releasing RPC event listeners..");
                _this.RPC.Destroy();
                _this.RPC = undefined;
            }
            if (_this._API_Endpoint) {
                _this._API_Endpoint.Destroy();
                _this._API_Endpoint = undefined;
                _this.API = undefined;
            }
            if (_this._process) {
                warn("Process " + (_this._process.pid + "").bold + " KILLED ");
                _this._process.removeAllListeners();
                try {
                    _this._process.kill();
                }
                catch (e) {
                }
                _this._process = undefined;
            }
            if (_this._status.State > 0) {
                _this._status.State = 0;
            }
            if (Node.fs.existsSync(_this._mainsock)) {
                Node.fs.unlinkSync(_this._mainsock);
            }
            if (Node.fs.existsSync(_this._webexsock)) {
                Node.fs.unlinkSync(_this._webexsock);
            }
            if (restart && _this._status.PlannedLaunchTime >= 0) {
                fatal(_this.App.name.bold + " * Next Launch in " + (_this._status.PlannedLaunchTime - Date.now()) / 1000 + " sec");
                var timer = setTimeout(function () {
                    clearTimeout(timer);
                    _this.Start();
                }, _this._status.PlannedLaunchTime - Date.now());
            }
            else if (restart) {
                _this.Start();
            }
        };
        this.GetSnapshot = function () {
            var _strip = Core.Data.Application.Strip(_this.App);
            var _status = _this._status;
            var _snapshot = {
                Id: _strip.uid,
                App: _strip,
                Status: _status
            };
            info(" * Snap * " + JSON.stringify(_snapshot));
            return _snapshot;
        };
        this.ForceError = function (e) {
            if (_this._status.State >= 0) {
                error("Forcing Error! " + e + " " + _this.App.name.bold);
                _this._proc_on_error(e);
            }
        };
        this.Broken = function () {
            error("Package is Broken / Tampered!! " + _this.App.name.bold.red);
            _this._status.State = -2;
            if (_this._process) {
                _this._process.kill();
            }
        };
        this.AfterLaunch = function (API) {
            if (_this._status.State == 1) {
                _this._status.State = 2;
                _this._status.LaunchTime = Date.now();
                _this._API_Endpoint = API;
                _this.API = _this._API_Endpoint.API;
                info("Package is Fully Up! : " + _this.App.name.bold);
                exec("chown nobody " + _this._mainsock, function () {
                });
                exec("chown nobody " + _this._webexsock, function () {
                });
                if (_this.App.urlName && _this.App.urlName.trim() !== "") {
                    Core.SubSys.FrontEnds.MainUI.HostnameTable[_this.App.uid] = [
                        _this.App.urlName.toLowerCase(),
                        _this._mainsock
                    ];
                    Core.SubSys.FrontEnds.MainUI.PrefixTable[_this.App.uid] = [
                        _this.App.urlName.toLowerCase(),
                        _this._mainsock
                    ];
                }
                _this._reset_launch_timeout();
                for (var i in _this.Driver) {
                    Core.Device.DriverManager.LoadDriver(_this.Driver[i], function (err) {
                        if (err) {
                            error(err);
                            error("InAppDriver failed to load: " + i);
                        }
                    });
                }
            }
            else {
                warn("AfterLaunch cannot be called multiple times (or in wrong state) " + _this.App.name.bold);
            }
        };
        this.UpdateResponsiveness = function () {
            if (_this._status.State > 1) {
                if (!_this.API.Heartbeat) {
                    return _this.ForceError("Heartbeat is missing :(");
                }
                _this.API.Heartbeat(Date.now(), _this._on_heartbeat);
            }
        };
        this.SafeQuit = function () {
            _this._reset_launch_timeout();
            if (_this._status.State > 1) {
                _this.Strobe_SafeQuit = true;
                _this.Stop(false);
            }
        };
        this.IsRunning = function () {
            return _this._status.State > 1;
        };
        this.Quota = function (cb, newval) {
            if (newval == undefined) {
                _this.Registry.get("QUOTA", ignore_err(withdefault(cb, CONF.ISO_DEFAULT_LIMIT)));
            }
            else {
                Core.SubSys.FileSystem.Limit.SetQuota({
                    user: _this.RuntimeId,
                    inode_hard: 0,
                    inode_soft: 0,
                    size_hard: newval,
                    size_soft: newval
                }, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    else {
                        _this.Registry.put("QUOTA", newval, cb);
                    }
                });
            }
            ;
        };
        this.QuotaUsage = function (cb) {
            if (!_this.IsRunning()) {
                return cb(new Error("Not Running"));
            }
            Core.SubSys.FileSystem.Limit.GetUserLimit(_this.RuntimeId, cb);
        };
        this.App = app;
        this.RuntimeId = runtimeId;
        if (!Node.fs.existsSync(this.GetAppRootPath()) || !Node.fs.existsSync(Node.path.join(this.GetAppRootPath(), "app.js")) || !Node.fs.existsSync(Node.path.join(this.GetAppRootPath(), "manifest.json")) || !Node.fs.statSync(Node.path.join(this.GetAppRootPath(), "app.js")).isFile() || !Node.fs.statSync(Node.path.join(this.GetAppRootPath(), "manifest.json")).isFile()) {
            throw new Error("Corrupt Package ~ " + this.App.uid.bold);
        }
        this.Manifest = JSON.parse(Node.fs.readFileSync(Node.path.join(this.GetAppRootPath(), "manifest.json"), "utf8").toString().trim());
        this._status = {
            Heartbeat: undefined,
            FailHistory: [],
            LaunchTime: -1,
            PlannedLaunchTime: -1,
            StabilityRating: 1,
            State: 0
        };
        this.Registry = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.App, this.App.uid);
        if (this.Manifest.drivers) {
            for (var id in this.Manifest.drivers) {
                var drv = new InAppDriver(this, id, this.Manifest.drivers[id].Buses, this.Manifest.drivers[id].Interest);
                this.Driver[id] = drv;
            }
        }
        trace("Runtime Initiated.. " + this.App.uid.bold);
    }
    return Runtime;
})();
function _GetQuota(callback) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage || !curPackage.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        curPackage && curPackage.ForceError(err.message);
        return callback(err, undefined);
    }
    curPackage.QuotaUsage(callback);
}
function _RaiseQuota(delta, callback) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage || !curPackage.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        curPackage && curPackage.ForceError(err.message);
        return callback(err, undefined);
    }
    curPackage.Quota(function (err, old) {
        if (err) {
            return callback(err, undefined);
        }
        else {
            return callback(new Error("Not Implemented!  :("));
        }
    });
}
function _SetupReverseAPI(api, callback) {
    var curPackage = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!curPackage || !curPackage.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        curPackage && curPackage.ForceError(err.message);
        return callback(err, undefined);
    }
    if (!api) {
        curPackage.ForceError("Corrupt Reverse API");
        return callback(new Error("Corrupt API :("));
    }
    var real = Core.RPC.APIManager.GetAPI(api, curPackage.RPC);
    try {
        info("Elevating Permission ~ " + curPackage.App.uid.bold);
        var perm = curPackage.Manifest.permission;
        Core.API.Permission.SetPermission(SenderId(this), perm);
        info("Permission set! " + curPackage.App.name.bold);
        info(JSON.stringify(Core.API.Permission.DecodeToString(Core.API.Permission.GetPermission(SenderId(this)))));
        curPackage.AfterLaunch(real);
        return callback(undefined, true);
    }
    catch (e) {
        error("Error elevating permission, might be dangerous, killing " + (curPackage.GetPID() + "").bold);
        error(e);
        return curPackage.ForceError(e);
    }
}
(__API(_SetupReverseAPI, "Sandbox.SetupReverseAPI", [9 /* AppPreLaunch */]));
(__API(_GetQuota, "IO.Quota.Stat", [7 /* AnyApp */, 3 /* IO */]));
(__API(_RaiseQuota, "IO.Quota.Raise", [7 /* AnyApp */, 3 /* IO */]));
module.exports = Runtime;
