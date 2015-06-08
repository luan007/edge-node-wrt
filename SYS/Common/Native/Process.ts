import child_process = require("child_process");
import events = require("events");
var _reg = {}; //name : .. mapping
//keep track for future use..

class ManagedProcess extends events.EventEmitter {

    public Process: child_process.ChildProcess;

    public Name: string;

    public Forever: boolean = false;

    private chocking = false;

    private chokeCounter = 0;

    public ChokeTolerance_Time = 1000;

    public ChokeTolerance_MAX = 5;

    private lastReboot = 0;

    protected Choke_Timer = undefined;

    public BypassStabilityTest = false;

    constructor(name?) {
        super();
        this.Name = name;
        if (name !== undefined) {
            _reg[name] = this;
        }
    }

    public Stop(restart: boolean = false) {
        clearTimeout(this.Choke_Timer);
        this.emit("stop", this);
        if (this.Process) {
            warn("Stop " + ('' + this.Process.pid.toString()).bold + " " + this.Name);
            this.Forever = restart;
            this.Process.kill();
        }
        else if (restart) {
            this.Forever = restart;
            this.Start();
        }
    }

    public Start(forever: boolean = true) {
        this.emit("start", this);
        clearTimeout(this.Choke_Timer);
        var time = new Date().getTime();
        if (time - this.lastReboot < this.ChokeTolerance_Time) {
            this.chokeCounter++;
        } else {
            this.chokeCounter = 0;
            this.chocking = false;
        }
        if (this.chokeCounter > this.ChokeTolerance_MAX) {
            if (this.OnChoke()) {
                return;
            }
        }
        this.lastReboot = time;
        info("Register " + ('' + this.Process.pid.toString()).bold + " " + this.Name);
        this.Forever = forever;
        this.HookEvent();

        if (CONF.IS_DEBUG && CONF.PROCESS_DEBUG) {
            this.Process.stdout.pipe(process.stdout);
            this.Process.stderr.pipe(process.stderr);
        }
    }

    private HookEvent() {
        this.Process.on("exit",() => {
            this.emit("exit", this);
            if(this.Process) {
                this.Process.removeAllListeners();
            }
            warn("Exited " + ('' +this.Process.pid.toString()).bold + " " + this.Name);
            this.Process = undefined;
            if (this.Forever) {
                this.Start();
            }
        });
    }

    public IsChoking() {
        return this.chokeCounter > this.ChokeTolerance_MAX;
    }

    /**
     * return True to abort a Start process
     */
    public OnChoke() {
        this.emit("choke", this);
        warn(this.Name.bold + " CHOKING");
        this.chocking = true;
        return false;
        //please override
        //return true to override start
    }

    public ClearChoke() {
        this.chokeCounter = 0;
        this.chocking = false;
    }

    public StabilityCheck = (cb) => {
        if (this.BypassStabilityTest) return cb(undefined, true);
        var pid;
        var t1 = setTimeout(() => {
            clearTimeout(t1);
            if (!this.Process) {
                clearTimeout(t2);
                return cb(new Error("Process " + this.Name + " is not Running"), false);
            }
            pid = this.Process.pid;
        }, 500);
        var t2 = setTimeout(() => {
            var result = !this.Process || (pid != this.Process.pid);
            clearTimeout(t2);
            cb(result ? new Error("Process is in Unstable state") : undefined, !result);
        }, 3000);
    };

}

export = ManagedProcess;