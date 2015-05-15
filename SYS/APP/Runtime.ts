/*Encaps one App*/
import child_process = require('child_process');
import fs = require('fs');
import path = require('path');
import InAppDriver = require("./Driver/InAppDriver");
import RuntimePool = require('./RuntimePool');
import AppManager = require('./AppManager');
import Limit =  require('./FileSystem/Limit');
import Tracker = require('./Ports/Tracker');
import _RPCEndpoint = require("../../Modules/RPC/RPC/RPCEndpoint");
import RPCEndpoint = _RPCEndpoint.RPCEndPoint;
import APIManager = require("../../Modules/RPC/API/APIManager");
import APIError = require("../../Modules/RPC/Lib/APIError");
import _Application = require('../DB/Models/Application');
import Application = _Application.Application;
import Registry =  require('../DB/Registry');
import User = require('../Common/Native/user');
//import MainUI = require('../Frontends/MainUI');
import DriverManager = require('../Device/DriverManager');
import PermissionLib = require('../API/Permission');
import Server = require('../API/Server');

//TODO: Add RLIMIT
//TODO: Add FileSystem Quota

/**
 *  App Status
 *   0 >  Ready
 *   1 >  Launching
 *   2 >  Launched
 *  -1 >  Error
 *  -2 >  Banned
 *  -3 >  Broken
 *  */

var _FAIL_STACK_SIZE:number = 30;

var _LAUNCH_TIMEOUT:number = 15000;

class Runtime {

    private _process:child_process.ChildProcess = undefined;

    private _API_Endpoint:APIManager.API_Endpoint;

    private _status:local.App.RuntimeStatus;

    private _launch_wait_clock;

    private _mainsock = getSock(UUIDstr());

    private _webexsock = getSock(UUIDstr());

    public Registry:Subkey;

    public App:Application;

    public Manifest:local.App.ApplicationManifest;

    public RPC:RPCEndpoint;

    public API:any;

    public RuntimeId:any;

    public Strobe_SafeQuit = false;

    public UserId:any;

    public Driver:IDic<IDriver> = {};

    //public DeathHooks:IDic<Function> = {};

    ////Release me babyyyy
    //public RegisterDeathHook = (name, func) => {
    //    this.DeathHooks[name] = func;
    //};
    //
    //public ReleaseDeathHook = (name, func) => {
    //    delete this.DeathHooks[name];
    //};

    constructor(runtimeId, app:Application) {
        this.App = app;
        this.RuntimeId = runtimeId;
        //FS CHECK
        //
        if (!fs.existsSync(this.GetAppRootPath())
            || !fs.existsSync(path.join(this.GetAppRootPath(), "app.js"))
            || !fs.existsSync(path.join(this.GetAppRootPath(), "manifest.json"))
            || !fs.statSync(path.join(this.GetAppRootPath(), "app.js")).isFile()
            || !fs.statSync(path.join(this.GetAppRootPath(), "manifest.json")).isFile()) {

            throw new Error("Corrupt Package ~ " + this.App.uid.bold);
        }
        this.Manifest = JSON.parse(fs.readFileSync(path.join(this.GetAppRootPath(), "manifest.json"), "utf8").toString().trim());
        this._status = {
            Heartbeat: undefined,
            FailHistory: [],
            LaunchTime: -1,
            PlannedLaunchTime: -1,
            StabilityRating: 1,
            State: 0
        };

        this.Registry = Registry.Sector(
            Registry.RootKeys.App,
            this.App.uid
        );

        if (this.Manifest.drivers) {
            for (var id in this.Manifest.drivers) {
                var drv = new InAppDriver(
                    this,
                    id,
                    this.Manifest.drivers[id].Buses,
                    this.Manifest.drivers[id].Interest);
                this.Driver[id] = drv;
            }
        }

        trace("Runtime Initiated.. " + this.App.uid.bold);
    }

    private _reset_launch_timeout = () => {
        if (this._launch_wait_clock !== undefined) {
            clearTimeout(this._launch_wait_clock);
            this._launch_wait_clock = undefined;
        }
    };

    private _start_launch_timeout = () => {
        this._reset_launch_timeout();
        this._launch_wait_clock = setTimeout(() => {
            warn("Launch Timed out... sorry " + this.App.name.bold);
            this._reset_launch_timeout();
            this.ForceError("Launch Sequence Timeout");
        }, _LAUNCH_TIMEOUT);
    };

    private _push_fail = (reason, err?) => {
        error(JSON.stringify(reason));
        this._status.FailHistory.unshift({
            LaunchTime: this._status.LaunchTime < 0 ? Date.now() : this._status.LaunchTime,
            ExitTime: Date.now(),
            Reason: reason
        });
        if (err) {
            this._status.FailHistory[0].Error = err;
        }
        if (this._status.FailHistory.length > _FAIL_STACK_SIZE) {
            this._status.FailHistory.pop();
        }
        this._status.LaunchTime = -1;
        this._status.State = -1;

        var avgLife = 0;
        for (var i = 0; i < this._status.FailHistory.length; i++) {
            var deltaT = this._status.FailHistory[i].ExitTime - this._status.FailHistory[i].LaunchTime;
            avgLife += deltaT / this._status.FailHistory.length;
        }

        this._status.StabilityRating = Math.min(CONF.APP_TRUST_LIFE, avgLife / 1000 / 60) / CONF.APP_TRUST_LIFE; // Maxout if avg > 5
        this._status.PlannedLaunchTime = Date.now() + Math.pow(10, (1 - this._status.StabilityRating) * CONF.APP_SPAN_SCALER) * 1000
        * (this._status.FailHistory.length / _FAIL_STACK_SIZE) * (this._status.FailHistory.length / _FAIL_STACK_SIZE);
        fatal(this.App.name.bold + " * StabilityRating " + (this._status.StabilityRating * 100 + "%")["yellowBG"].black.bold);
    };

    private _proc_on_exit = () => {

        //for (var i in this.DeathHooks) {
        //    this.DeathHooks[i](this);
        //}
        //
        //this.DeathHooks = {};
        if (this._status.State == -2)
            return; //BROKEN

        if (!this.Strobe_SafeQuit) {
            this._push_fail("Sudden Termination");
        }
        this._reset_launch_timeout();
        this._process.removeAllListeners();
        this._process = undefined;
        this.Strobe_SafeQuit = false;
        this.Stop(true);
    };

    private _proc_on_error = (e) => {
        this._push_fail(e);
        this.Strobe_SafeQuit = true;
        this.Stop(true);
    };

    private _on_heartbeat = (err, deltaT) => {
        if (this._status.State <= 1) {
            return; //throw away
        }
        else if (err) {
            //WOW TIMEDOUT BABE
            this.ForceError("Heartbeat Error");
        } else {
            this._status.Heartbeat = {
                DeltaT: deltaT,
                Sent: Date.now() - deltaT
            };
        }
    };

    GetPID = () => {
        return this._process.pid;
    };

    GetProcess = () => {
        return this._process;
    };

    GetAppRootPath = () => {
        return path.join(/*SHADOW_BASE_PATH, */CONF.APP_BASE_PATH, this.App.uid);
    };

    GetAppDataPath = () => {
        return AppManager.GetAppDataDir(this.App.uid);
    };

    private _check = (target_dir, api_salt, cb) => {
        if (CONF.IS_DEBUG && CONF.BYPASS_APP_SIGCHECK) {
            warn("!!Sigcheck Bypassed!!");
            return cb(undefined, true);
        }
        try {
            var salt = new Buffer(api_salt, "hex");
            var hash = HashDir(target_dir, salt);
            var snapshot = salt.toString("hex") + hash.toString("hex");
            return cb(undefined, RSA_Verify("App", api_salt, snapshot));
        } catch (e) {
            return cb(e, false);
        }
    };

    private _ensure_user = (cb) => {
        User.Get(this.RuntimeId, (err, user) => {
            if (err) {
                return cb(err, undefined);
            }
            if (!user) {
                trace("Creating User for Runtime .." + this.App.name.bold);
                User.Create(
                    this.RuntimeId,
                    "nogroup",
                    undefined,
                    (err, result) => {
                        if (err) {
                            return (new Error("Cannot Create User"), undefined);
                        }
                        User.Get(this.RuntimeId, (err, user) => {
                            if (err) {
                                return (new Error("Cannot Create User"), undefined);
                            }
                            this.UserId = user.userId;
                            trace("User Created");
                            return cb(undefined, this.UserId);
                        });
                    });
            }
            else {
                this.UserId = user.userId;
                return cb(undefined, user.userId);
            }
        });
    };

    private _setup_quota = (cb) => {
        this.Quota((err, quota) => {
            if (err) return cb(err);
            this.Quota(cb, quota);
        });
    };

    private _clean_up = (cb) => {
        trace("Cleaning Up..");

        Tracker.ReleaseByOwner(this.RuntimeId, (err, result) => {
            if (err) warn(err);
            umount_till_err(AppManager.GetAppDataLn(this.App.uid), (err, result) => {
                try {
                    if (fs.existsSync(AppManager.GetAppDataLn(this.App.uid))) {
                        fs.rmdirSync(AppManager.GetAppDataLn(this.App.uid)); //that's it..
                    }
                } catch (e) {
                    warn("Failed to remove AppData Folder, but that's possibly OK");
                }
                try {
                    if (fs.existsSync(this._mainsock)) {
                        fs.rmdirSync(this._mainsock); //that's it..
                    }
                } catch (e) {
                    warn("Failed to remove MainSocket, but that's possibly OK");
                }
                try {
                    if (fs.existsSync(this._webexsock)) {
                        fs.rmdirSync(this._webexsock); //that's it..
                    }
                } catch (e) {
                    warn("Failed to remove WebSocket, but that's possibly OK");
                }
                return cb();
            });
        });
    };

    Start = () => {
        error("WARNING, CHMOD 0711 IS NOT SECURE!!");
        if (this._status.State == -2) {
            warn("[ SKIP ] App is marked Broken " + this.App.name.bold);
            return;
        }
        if (this._process) {
            //Kill it if being alive
            this.Stop(false);
        }
        var path = AppManager.GetAppDataDir(this.App.uid);
        async.series([
            this._clean_up,
            (cb) => {
                this._check(this.GetAppRootPath(), this.App.appsig.substr(0, 512), (err, result) => {
                    if (err || !result) {
                        this.Broken();
                    }
                    cb(err, result);
                });
            },
            this._ensure_user,
            (cb) => {
                if (CONF.CODE_WRITE_LOCK) {
                    AppManager.SetOwner_Recursive(this.GetAppRootPath(), this.RuntimeId, cb);
                } else {
                    return cb();
                }
            },
            (cb) => {
                AppManager.SetupAppDataDir(this.App.uid, this.RuntimeId,
                    (err, p) => {
                        if (err) {
                            error(err);
                            this.Broken();
                            return cb(err, undefined);
                        }
                        return cb(undefined);
                    });
            },
            this._setup_quota,
            (cb:Callback) => {
                fs.mkdir(AppManager.GetAppDataLn(this.App.uid), <any>ignore_err(cb));
            },
            mount_auto.bind(null, path, AppManager.GetAppDataLn(this.App.uid), ["--bind"]),
            exec.bind(null, "chown", "root", this.GetAppRootPath()),
            exec.bind(null, "chmod", "0755", this.GetAppRootPath()),
            exec.bind(null, "chown", this.RuntimeId, AppManager.GetAppDataLn(this.App.uid)),
            exec.bind(null, "chmod", "-R", "0755", AppManager.GetAppDataLn(this.App.uid)) //TODO: FIX THIS CHMOD 711 -> 701
        ], (e, r) => {
            if (e) {
                error(e);
                return this.ForceError(e);
            }
            this._start_launch_timeout();
            trace("Launching " + this.App.name.bold);
            trace("--with Data Path " + path);
            trace("--with RuntimeId " + this.RuntimeId.bold);
            this._status.State = 1; //Launching
            this._status.LaunchTime = -1; //wait..
            this._status.PlannedLaunchTime = -1;
            var env:any = <local.App.Init_Env>{
                target_dir: this.GetAppRootPath(),
                api_socket_path: Server.GetAPIServer_SockPath(),
                main_socket: this._mainsock,
                webex_socket: this._webexsock,
                //api_salt: this.App.appsig.substr(0, 512),
                runtime_id: this.RuntimeId,
                api_obj: Server.GetAPIJSON()
            };
            env.NODE_PATH = process.env.NODE_PATH;
            trace("--with Env" + "\n" + ('' + JSON.stringify(env)).bold);
            this._process = child_process.spawn("node", ["./App/Sandbox/Sandbox.js"], {
                env: env,
                stdio: CONF.IS_DEBUG ? [process.stdin, process.stdout, 'pipe'] : 'ignore',
                detached: CONF.DO_NOT_DETACH ? false : true //important
            });
            trace("Process Started With PID " + (this._process.pid + "").bold);
            this._process.on("error", this._proc_on_error);
            this._process.on("message", (e) => {
                this._push_fail("Error", e);
                this.Stop(true);
            });
            this._process.on("exit", this._proc_on_exit);

            if (CONF.IS_DEBUG) {
                this._process.stderr.on("data", (data) => {
                    error(data.toString());
                });
            }

        });
        //this._process.stdout.pipe(process.stdout);
        //this._process.stderr.pipe(process.stderr);
    };

    Status = () => {
        return this._status;
    };

    MainSock = () => {
        return this._mainsock;
    }

    WebExSock = () => {
        return this._webexsock;
    }

    Stop = (restart) => {

        if (this._status.State == -2) {
            warn("[ STOP ] App is marked Broken " + this.App.name.bold);
            return;
        }

        this._reset_launch_timeout();
        if (this.RPC) {
            warn("Releasing RPC event listeners..");
            this.RPC.Destroy();
            this.RPC = undefined;
        }

        if (this._API_Endpoint) {
            this._API_Endpoint.Destroy();
            this._API_Endpoint = undefined;
            this.API = undefined;
        }

        if (this._process) {
            warn("Process " + (this._process.pid + "").bold + " KILLED ");
            this._process.removeAllListeners();
            try {
                this._process.kill();
            } catch (e) {
            }
            this._process = undefined;
        }

        if (this._status.State > 0) {
            this._status.State = 0;
        }

        if (fs.existsSync(this._mainsock)) {
            fs.unlinkSync(this._mainsock);
        }
        if (fs.existsSync(this._webexsock)) {
            fs.unlinkSync(this._webexsock);
        }
        if (restart && this._status.PlannedLaunchTime >= 0) {
            fatal(this.App.name.bold + " * Next Launch in " + (this._status.PlannedLaunchTime - Date.now()) / 1000 + " sec");
            var timer = setTimeout(() => {
                clearTimeout(timer);
                this.Start();
            }, this._status.PlannedLaunchTime - Date.now());
        } else if (restart) {
            this.Start();
        }


    };

    ForceError = (e) => {
        if (this._status.State >= 0) { // >= error
            error("Forcing Error! " + e + " " + this.App.name.bold);
            this._proc_on_error(e);
        }
    };

    Broken = () => {
        error("Package is Broken / Tampered!! " + this.App.name.bold.red);
        this._status.State = -2;
        if (this._process) {
            this._process.kill();
        }
    };

    AfterLaunch = (API) => {
        if (this._status.State == 1) {
            this._status.State = 2;
            this._status.LaunchTime = Date.now();
            this._API_Endpoint = API;
            this.API = this._API_Endpoint.API;
            info("Package is Fully Up! : " + this.App.name.bold);

            exec("chown nobody " + this._mainsock, () => {
            });
            exec("chown nobody " + this._webexsock, () => {
            });

            //if (this.App.urlName && this.App.urlName.trim() !== "") {
            //    MainUI.HostnameTable[this.App.uid] = [
            //        this.App.urlName.toLowerCase(),
            //        this._mainsock
            //    ];
            //    MainUI.PrefixTable[this.App.uid] = [
            //        this.App.urlName.toLowerCase(),
            //        this._mainsock
            //    ];
            //}

            this._reset_launch_timeout();
            for (var i in this.Driver) {
                DriverManager.LoadDriver(this.Driver[i], (err) => {
                    if (err) {
                        error(err);
                        error("InAppDriver failed to load: " + i);
                    }
                }); //in-app-drv
            }
        }
        else {
            warn("AfterLaunch cannot be called multiple times (or in wrong state) " + this.App.name.bold);
        }
    };

    UpdateResponsiveness = () => {
        //if we are in a solid launched state
        if (this._status.State > 1) {
            if (!this.API.Heartbeat) {
                return this.ForceError("Heartbeat is missing :(");
            }
            this.API.Heartbeat(Date.now(), this._on_heartbeat);
        }
        //just skip
    };

    SafeQuit = () => {
        this._reset_launch_timeout();
        if (this._status.State > 1) {
            this.Strobe_SafeQuit = true;
            this.Stop(false);
        }
    };

    IsRunning = () => {
        return this._status.State > 1;
    };

    Quota = (cb, newval?) => {
        //if (!this.IsRunning() && newval) {
        //    return cb(new Error("Not Running"));
        //}
        if (newval == undefined) {
            this.Registry.get("QUOTA",
                ignore_err(withdefault(cb, CONF.ISO_DEFAULT_LIMIT)));
        } else {
            Limit.SetQuota({
                user: this.RuntimeId,
                inode_hard: 0,
                inode_soft: 0,
                size_hard: newval,
                size_soft: newval
            }, (err) => {
                if (err) {
                    return cb(err);
                } else {
                    this.Registry.put("QUOTA", newval, cb);
                }
            });
        }
    };

    QuotaUsage = (cb) => {
        if (!this.IsRunning()) {
            return cb(new Error("Not Running"));
        }
        Limit.GetUserLimit(this.RuntimeId, cb);
    };

}

export = Runtime;

function _GetQuota(callback) {
    var curPackage = RuntimePool.GetCallingRuntime(this);
    if (!curPackage || !curPackage.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        curPackage && curPackage.ForceError(err.message);
        return callback(err, undefined);
    }
    curPackage.QuotaUsage(callback);
}

function _RaiseQuota(delta, callback) {
    var curPackage = RuntimePool.GetCallingRuntime(this);
    if (!curPackage || !curPackage.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        curPackage && curPackage.ForceError(err.message);
        return callback(err, undefined);
    }
    curPackage.Quota((err, old) => {
        if (err) {
            return callback(err, undefined);
        } else {
            //DO THOSE STUFF
            return callback(new Error("Not Implemented!  :("));
        }
    });
}

function _SetupReverseAPI(api, callback) {
    var curPackage:Runtime = RuntimePool.GetCallingRuntime(this);
    //
    if (!curPackage || !curPackage.RPC) {
        var err = new Error("Who are you? / or I didnt find any RPC socket :(");
        curPackage && curPackage.ForceError(err.message);
        return callback(err, undefined);
    }

    if (!api) {
        curPackage.ForceError("Corrupt Reverse API");
        return callback(new Error("Corrupt API :("));
    }
    var real = APIManager.GetAPI(api, curPackage.RPC);
    //NICE
    //return callback(undefined, true);

    /**UPDATE PERMISSION**/
    try {
        info("Elevating Permission ~ " + curPackage.App.uid.bold);
        //Trusted?

        //TODO: ADD trust splitter here

        //var trimmed: string = curPackage.Manifest.permission; //FIX THIS

        ////value are sepped with & then saved
        ////(HEX[14930&1843102393&849104] HEX[256byte salt]) ->>> sign
        //var data = trimmed.split("&");
        //var perm = new Array(data.length);
        //for (var i = 0; i < data.length; i++) {
        //    perm[i] = Number(data[i]);
        //}
        //PermissionLib.SetPermission(SenderId(this), perm);
        //info("Permission set! " + GetCallingRuntime(this).App.uid.bold);
        //info(JSON.stringify(PermissionLib.Decode(perm)));

        var perm = curPackage.Manifest.permission;
        PermissionLib.SetPermission(SenderId(this), perm);
        info("Permission set! " + curPackage.App.name.bold);
        info(JSON.stringify(
                PermissionLib.DecodeToString(
                    PermissionLib.GetPermission(SenderId(this))))
        );
        curPackage.AfterLaunch(real);
        return callback(undefined, true);

    } catch (e) {
        error("Error elevating permission, might be dangerous, killing " + (curPackage.GetPID() + "").bold);
        error(e);
        return curPackage.ForceError(e);
    }

}

(__API(_SetupReverseAPI, "Sandbox.SetupReverseAPI", [Permission.AppPreLaunch]));
(__API(_GetQuota, "IO.Quota.Stat", [Permission.AnyApp, Permission.IO]));
(__API(_RaiseQuota, "IO.Quota.Raise", [Permission.AnyApp, Permission.IO]));