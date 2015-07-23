/*Encaps one App*/
import child_process = require('child_process');
import fs = require('fs');
import path = require('path');
import events = require('events');
import InAppDriver = require("./Driver/InAppDriver");
import RuntimePool = require('./RuntimePool');
import AppManager = require('./AppManager');
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

var _FAIL_STACK_SIZE:number = 99;


const COUNT = 65532;
var VirtualIpLeases = new Array(COUNT);


function LeaseVirtualIp(){

    if(Object.keys(VirtualIpLeases).length >= COUNT) {
        return undefined;
    }
    else {
        for(var i = 0; i < COUNT; i++) {
            if(!VirtualIpLeases[i]) {
                VirtualIpLeases[i] = 1;
                return "172.16." + ((i + 2) >> 8) + "." + ((i + 2) & 0xFF);

            }
        }
    }

}

function ReleaseVirtualIp(i){
    if(VirtualIpLeases[i])
        VirtualIpLeases[i] = 0;
}

var runtime_pool_pids = {};

function ReportRuntimePID(pid) {
    runtime_pool_pids[pid] = 1;
    intoQueue('write_runtimepool_pids', (cb) => {
        fs.writeFile(CONF.APP_PID_FILE, JSON.stringify(Object.keys(runtime_pool_pids)), ()=> {
        });
        cb();
    }, () => {
    });
}

function RemoveRuntimePID(pid) {
    if(runtime_pool_pids[pid]) {
        delete runtime_pool_pids[pid];
        intoQueue('write_runtimepool_pids', (cb) => {
            fs.writeFile(CONF.APP_PID_FILE, JSON.stringify(Object.keys(runtime_pool_pids)), ()=> {
            });
            cb();
        }, () => {
        });
    }
}

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

    private _virtualip;

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
        this.Manifest = JSON.parse(fs.readFileSync(path.join(AppManager.GetAppRootPath(this.App.uid), "manifest.json"), "utf8").toString().trim());

        //FS CHECK
        //
        if (!fs.existsSync(AppManager.GetAppRootPath(app.uid))
            || !fs.existsSync(path.join(AppManager.GetAppRootPath(app.uid), "app.js"))
            || !fs.existsSync(path.join(AppManager.GetAppRootPath(app.uid), "manifest.json"))
            || !fs.statSync(path.join(AppManager.GetAppRootPath(app.uid), "app.js")).isFile()
            || !fs.statSync(path.join(AppManager.GetAppRootPath(app.uid), "manifest.json")).isFile()) {

            throw new Error("Corrupt Package ~ " + this.App.uid.bold);
        }

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

        var avgLife = 0;
        for (var i = 0; i < this._status.FailHistory.length; i++) {
            var deltaT = this._status.FailHistory[i].ExitTime - this._status.FailHistory[i].LaunchTime;
            avgLife += deltaT / this._status.FailHistory.length;
        }

        this._status.StabilityRating = Math.min(CONF.APP_TRUST_LIFE, avgLife / 1000 / 60) / CONF.APP_TRUST_LIFE; // Maxout if avg > 5
        this._status.PlannedLaunchTime = //Date.now() +
            Math.pow(10, (1 - this._status.StabilityRating) * CONF.APP_SPAN_SCALER) * 1000
            * (this._status.FailHistory.length / _FAIL_STACK_SIZE) * (this._status.FailHistory.length / _FAIL_STACK_SIZE);
        info(this.App.name.bold + " * StabilityRating " + (this._status.StabilityRating * 100 + "%")["yellowBG"].black.bold);
        console.log('^------------------^ PlannedLaunchTime', this._status.PlannedLaunchTime);

        this._stateMachine(RuntimeStatusEnum.Error);
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
            this.emit('heartbeat', this._status);
        }
    };

    GetPID = () => {
        return this._process.pid;
    };

    GetProcess = () => {
        return this._process;
    };

    Start = () => {
        clearTask('relaunch_' + this.App.uid);
        try {
            this.Manifest = JSON.parse(fs.readFileSync(path.join(AppManager.GetAppRootPath(this.App.uid), "manifest.json"), "utf8").toString().trim());
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
        } catch(err) {
            error(err);
            return this.Broken();
        }

        if (this._status.State == RuntimeStatusEnum.Broken) {
            error("[ SKIP ] App is marked Broken " + this.App.name.bold);
            return this.Stop();
        }
        warn("WARNING, CHMOD 0711 IS NOT SECURE!!");

        if (this._process) {
            //Kill it if being alive
            this.Stop();
        }
        var appDataPath = AppManager.GetAppDataDir(this.App.uid);
        trace(appDataPath);
        this._virtualip = LeaseVirtualIp();
        if(!this._virtualip){
            this._push_fail(new Error('Run out of virtual Ip!'));
            return this.Stop();
        }

        trace("Launching " + this.App.name.bold);
        trace("--with Data Path " + appDataPath);
        trace("--with RuntimeId " + this.RuntimeId.bold);
        this._status.LaunchTime = -1; //wait..
        this._status.PlannedLaunchTime = -1;
        this._stateMachine(RuntimeStatusEnum.Launching); //Launching
        var env:any = <local.App.Init_Env>{
            target_dir: AppManager.GetAppRootPath(this.App.uid),
            api_socket_path: Server.GetAPIServer_SockPath(),
            main_socket: this._mainsock,
            webex_socket: this._webexsock,
            //api_salt: this.App.appsig.substr(0, 512),
            runtime_id: this.RuntimeId,
            virtual_ip: this._virtualip,
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
    };

    Status = () => {
        return this._status;
    };

    MainSock = () => {
        return this._mainsock;
    };

    WebExSock = () => {
        return this._webexsock;
    };

    Terminate = () => { // terminate by external process.
        this._stateMachine(RuntimeStatusEnum.Terminated);
        this.Stop();
    };

    Stop = () => {

        clearTask('relaunch_' + this.App.uid);

        RemoveRuntimePID(this.GetPID());
        ReleaseVirtualIp(this._virtualip);
        if (this.RPC) {
            trace("Releasing RPC event listeners..");
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

        if (fs.existsSync(this._mainsock)) {
            fs.unlinkSync(this._mainsock);
        }
        if (fs.existsSync(this._webexsock)) {
            fs.unlinkSync(this._webexsock);
        }

        if (this._status.State == RuntimeStatusEnum.Error) {
            console.log('============((( emit relaunch',  this._status.PlannedLaunchTime);

            if (this.System) {
                process.nextTick(() => { // system app
                    this.Start();
                });
            } else {
                setTask('relaunch_' + this.App.uid, () => {
                    this.Start();
                }, this._status.PlannedLaunchTime);
            }

            this.emit('relaunch', this._status.PlannedLaunchTime);
        } else if (this._status.State == RuntimeStatusEnum.Terminated) {
            console.log('============((( emit terminated');
            this.emit('terminated');
            this.removeAllListeners();
        } else if (this._status.State == RuntimeStatusEnum.Broken) {
            fatal("[ STOP ] App is marked Broken " + this.App.name.bold);
            this.emit('broken');
            this.removeAllListeners();
        } else if (this._status.State == RuntimeStatusEnum.Launching || this._status.State == RuntimeStatusEnum.Launched) {
            this._stateMachine(RuntimeStatusEnum.Ready);
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
        this._stateMachine(RuntimeStatusEnum.Broken);
        if (this._process) {
            this._process.kill();
        }
    };

    AfterLaunch = (API) => {
        if (this._status.State == RuntimeStatusEnum.Launching) {
            this._status.LaunchTime = Date.now();
            this._stateMachine(RuntimeStatusEnum.Launched);
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

    private _stateMachine(state){
        this._status.State = state;
        this.emit('state', this._status);
    }

}