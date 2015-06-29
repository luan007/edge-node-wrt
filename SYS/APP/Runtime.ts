/*Encaps one App*/
import child_process = require('child_process');
import fs = require('fs');
import path = require('path');
import events = require('events');
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
 *  -4 >  Terminated
 *  */

var _FAIL_STACK_SIZE:number = 30;

export class RuntimeStatusEnum {
    static Ready:number = 0;
    static Launching:number = 1;
    static Launched:number = 2;
    static Error:number = -1;
    static Banned:number = -2;
    static Broken:number = -3;
    static Terminated:number = -4;
}

export class Runtime extends events.EventEmitter {

    private _process:child_process.ChildProcess = undefined;

    private _API_Endpoint:APIManager.API_Endpoint;

    private _status:local.App.RuntimeStatus;

    private _mainsock = getSock(UUIDstr());

    private _webexsock = getSock(UUIDstr());

    public Registry:Subkey;

    public App:Application;

    public Manifest:local.App.ApplicationManifest;

    public RPC:RPCEndpoint;

    public API:any;

    public RuntimeId:any;

    public UserId:any;

    public Drivers:IDic<IDriver> = {};

    public System:boolean = false;

    constructor(runtimeId, app:Application) {
        super();

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
            State: RuntimeStatusEnum.Ready,
            IsLauncher: this.Manifest.is_system ? true : false,
            AppUrl: this.Manifest.url,
            AppName: this.Manifest.name,
            MainSock: this._mainsock,
            WebExSock: this._webexsock,
            RuntimeId: runtimeId
        };

        this.System = this.Manifest.is_system;

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
                this.Drivers[id] = drv;
            }
        }

        trace("Runtime Initiated.. " + this.App.uid.bold);
    }

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
        this._status.State = RuntimeStatusEnum.Error;

        var avgLife = 0;
        for (var i = 0; i < this._status.FailHistory.length; i++) {
            var deltaT = this._status.FailHistory[i].ExitTime - this._status.FailHistory[i].LaunchTime;
            avgLife += deltaT / this._status.FailHistory.length;
        }

        this._status.StabilityRating = Math.min(CONF.APP_TRUST_LIFE, avgLife / 1000 / 60) / CONF.APP_TRUST_LIFE; // Maxout if avg > 5
        this._status.PlannedLaunchTime = //Date.now() +
            Math.pow(10, (1 - this._status.StabilityRating) * CONF.APP_SPAN_SCALER) * 1000
            * (this._status.FailHistory.length / _FAIL_STACK_SIZE) * (this._status.FailHistory.length / _FAIL_STACK_SIZE);
        fatal(this.App.name.bold + " * StabilityRating " + (this._status.StabilityRating * 100 + "%")["yellowBG"].black.bold);
        console.log('^------------------^ PlannedLaunchTime', this._status.PlannedLaunchTime);
    };

    private _on_heartbeat = (err, deltaT) => {
        if (this._status.State != RuntimeStatusEnum.Launching && this._status.State != RuntimeStatusEnum.Launched) {
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
        if (this._status.State == RuntimeStatusEnum.Broken) {
            error("[ SKIP ] App is marked Broken " + this.App.name.bold);
            return this.Stop();
        }

        warn("WARNING, CHMOD 0711 IS NOT SECURE!!");

        if (this._process) {
            //Kill it if being alive
            this.Stop();
        }
        var path = AppManager.GetAppDataDir(this.App.uid);

        trace("Launching " + this.App.name.bold);
        trace("--with Data Path " + path);
        trace("--with RuntimeId " + this.RuntimeId.bold);
        this._status.State = RuntimeStatusEnum.Launching; //Launching
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
            stdio: CONF.IS_DEBUG ? [process.stdin, process.stdout, 'pipe'] : 'ignore',
            detached: !CONF.DO_NOT_DETACH  //important
        });
        ReportRuntimePID(this._process.pid);
        console.log("Process Started With PID " + (this._process.pid + "").bold);

        this._process.on("error", (e) => {
            console.log('^------------------^ process.on(error)', e);
            this._push_fail(e);
            this.Stop();
        });
        this._process.on("message", (e) => {
            console.log('^------------------^ process.on(message)', e);
            this._push_fail("Error", e);
            this.Stop();
        });
        this._process.on("exit", () => {
            console.log('^------------------^ process.on(exit)');
            this._push_fail("exit");
            this.Stop();
        });

        //if (CONF.IS_DEBUG) {
        //    if(this._process.stdout) {
        //        this._process.stdout.on('data', (data) => {
        //            console.log('process stdout data:', data.toString());
        //        });
        //    }
        //    if(this._process.stderr) {
        //        this._process.stderr.on("data", (data) => {
        //            error(data.toString());
        //        });
        //    }
        //}
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

    Terminate = () => { // terminate by external process.
        this._status.State = RuntimeStatusEnum.Terminated;
        this.Stop();
    }

    Stop = () => {

        if (this.RPC) {
            fatal("Releasing RPC event listeners..");
            this.RPC.Destroy();
            this.RPC = undefined;
        }

        if (this._API_Endpoint) {
            this._API_Endpoint.Destroy();
            this._API_Endpoint = undefined;
            this.API = undefined;
        }

        if (this._process) {
            fatal("Process " + (this._process.pid + "").bold + " KILLED ");
            this._process.removeAllListeners();
            try {
                this._process.kill();
            } catch (e) {
            }
            this._process = undefined;
        }

        if (this._status.State == RuntimeStatusEnum.Launching || this._status.State == RuntimeStatusEnum.Launched) {
            this._status.State = RuntimeStatusEnum.Ready;
        }

        if (fs.existsSync(this._mainsock)) {
            fs.unlinkSync(this._mainsock);
        }
        if (fs.existsSync(this._webexsock)) {
            fs.unlinkSync(this._webexsock);
        }

        if (this._status.State == RuntimeStatusEnum.Error) {
            console.log('============((( emit relaunch',  this._status.PlannedLaunchTime);
            this.emit('relaunch', this._status.PlannedLaunchTime);
        } else if (this._status.State == RuntimeStatusEnum.Terminated) {
            console.log('============((( emit terminated');
            this.emit('terminated');
            this.removeAllListeners();
        } else if (this._status.State == RuntimeStatusEnum.Broken) {
            fatal("[ STOP ] App is marked Broken " + this.App.name.bold);
            this.emit('broken');
            this.removeAllListeners();
        }
    };

    ForceError = (e) => {
        if (this._status.State == RuntimeStatusEnum.Launching || this._status.State == RuntimeStatusEnum.Launched) { // >= error
            error("Forcing Error! " + e + " " + this.App.name.bold);
            this._push_fail(e);
            this.Stop();
        }
    };

    Broken = () => {
        error("Package is Broken / Tampered!! " + this.App.name.bold.red);
        this._status.State = RuntimeStatusEnum.Broken;
        if (this._process) {
            this._process.kill();
        }
    };

    AfterLaunch = (API) => {
        if (this._status.State == RuntimeStatusEnum.Launching) {
            this._status.State = RuntimeStatusEnum.Launched;
            this._status.LaunchTime = Date.now();
            this._API_Endpoint = API;
            this.API = this._API_Endpoint.API;
            info("Package is Fully Up! : " + this.App.name.bold);

            exec("chown nobody " + this._mainsock, () => {
            });
            exec("chown nobody " + this._webexsock, () => {
            });

            for (var i in this.Drivers) {
                DriverManager.LoadDriver(this.Drivers[i], (err) => {
                    if (err) {
                        error(err);
                        error("InAppDriver failed to load: " + i);
                    }
                }); //in-app-drv
            }

            this.emit('launched'); // ==> notify runtime-pool
        }
        else {
            warn("AfterLaunch cannot be called multiple times (or in wrong state) " + this.App.name.bold);
        }
    };

    UpdateResponsiveness = () => {
        //if we are in a solid launched state
        if (this.IsRunning()) {
            if (!this.API.Heartbeat) {
                return this.ForceError("Heartbeat is missing :(");
            }
            this.API.Heartbeat(Date.now(), this._on_heartbeat);
        }
        //just skip
    };

    IsRunning = () => {
        return this._status.State === RuntimeStatusEnum.Launched;
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