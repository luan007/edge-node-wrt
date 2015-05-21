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
        if (!fs.existsSync(AppManager.GetAppRootPath(app.uid))
            || !fs.existsSync(path.join(AppManager.GetAppRootPath(app.uid), "app.js"))
            || !fs.existsSync(path.join(AppManager.GetAppRootPath(app.uid), "manifest.json"))
            || !fs.statSync(path.join(AppManager.GetAppRootPath(app.uid), "app.js")).isFile()
            || !fs.statSync(path.join(AppManager.GetAppRootPath(app.uid), "manifest.json")).isFile()) {

            throw new Error("Corrupt Package ~ " + this.App.uid.bold);
        }
        this.Manifest = JSON.parse(fs.readFileSync(path.join(AppManager.GetAppRootPath(app.uid), "manifest.json"), "utf8").toString().trim());
        this._status = {
            Heartbeat: undefined,
            FailHistory: <any>[],
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
        this.Stop();
    };

    private _proc_on_error = (e) => {
        this._push_fail(e);
        this.Strobe_SafeQuit = true;
        this.Stop();
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

    Start = () => {
        error("WARNING, CHMOD 0711 IS NOT SECURE!!");
        if (this._status.State == -2) {
            warn("[ SKIP ] App is marked Broken " + this.App.name.bold);
            return;
        }
        if (this._process) {
            //Kill it if being alive
            this.Stop();
        }
        var path = AppManager.GetAppDataDir(this.App.uid);

        this._start_launch_timeout();
        trace("Launching " + this.App.name.bold);
        trace("--with Data Path " + path);
        trace("--with RuntimeId " + this.RuntimeId.bold);
        this._status.State = 1; //Launching
        this._status.LaunchTime = -1; //wait..
        this._status.PlannedLaunchTime = -1;
        var env:any = <local.App.Init_Env>{
            target_dir: AppManager.GetAppRootPath(this.App.uid),
            api_socket_path: Server.GetAPIServer_SockPath(),
            main_socket: this._mainsock,
            webex_socket: this._webexsock,
            //api_salt: this.App.appsig.substr(0, 512),
            runtime_id: this.RuntimeId,
            api_obj: Server.GetAPIJSON()
        };
        env.NODE_PATH = process.env.NODE_PATH;
        trace("--with Env" + "\n" + ('' + JSON.stringify(env)).bold);
        this._process = child_process.spawn("node", ["./APP/Sandbox/Sandbox.js"], {
            env: env,
            stdio: CONF.IS_DEBUG ? [process.stdin, 'pipe', 'pipe'] : 'ignore',
            detached: CONF.DO_NOT_DETACH ? false : true //important
        });
        trace("Process Started With PID " + (this._process.pid + "").bold);
        this._process.on("error", this._proc_on_error);
        this._process.on("message", (e) => {
            this._push_fail("Error", e);
            this.Stop();
        });
        this._process.on("exit", this._proc_on_exit);

        if (CONF.IS_DEBUG) {
            this._process.stdout.on('data', (data) => {
                console.log('process stdout data:', data.toString());
            });

            this._process.stderr.on("data", (data) => {
                error(data.toString());
            });
        }
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

    Stop = () => {

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
            this.Stop();
        }
    };

    IsRunning = () => {
        return this._status.State > 1;
    };

    Quota = (cb, newval?) => {
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
}

export = Runtime;