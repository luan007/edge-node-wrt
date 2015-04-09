var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");
var _reg = {};
var ManagedProcess = (function (_super) {
    __extends(ManagedProcess, _super);
    function ManagedProcess(name) {
        var _this = this;
        _super.call(this);
        this.Forever = false;
        this.chocking = false;
        this.chokeCounter = 0;
        this.ChokeTolerance_Time = 1000;
        this.ChokeTolerance_MAX = 5;
        this.lastReboot = 0;
        this.Choke_Timer = undefined;
        this.BypassStabilityTest = false;
        this.StabilityCheck = function (cb) {
            if (_this.BypassStabilityTest)
                return cb();
            var pid;
            var t1 = setTimeout(function () {
                clearTimeout(t1);
                if (!_this.Process) {
                    clearTimeout(t2);
                    return cb(new Error("Process is not Running"), false);
                }
                pid = _this.Process.pid;
            }, 500);
            var t2 = setTimeout(function () {
                var result = !_this.Process || (pid != _this.Process.pid);
                clearTimeout(t2);
                cb(result ? new Error("Process is in Unstable state") : undefined, result);
            }, 3000);
        };
        this.Name = name;
        if (name !== undefined) {
            _reg[name] = this;
        }
    }
    ManagedProcess.prototype.Stop = function (restart) {
        if (restart === void 0) { restart = false; }
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
    };
    ManagedProcess.prototype.Start = function (forever) {
        if (forever === void 0) { forever = true; }
        this.emit("start", this);
        clearTimeout(this.Choke_Timer);
        var time = new Date().getTime();
        if (time - this.lastReboot < this.ChokeTolerance_Time) {
            this.chokeCounter++;
        }
        else {
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
    };
    ManagedProcess.prototype.HookEvent = function () {
        var _this = this;
        this.Process.on("exit", function () {
            _this.emit("exit", _this);
            if (_this.Process) {
                _this.Process.removeAllListeners();
            }
            warn("Exited " + ('' + _this.Process.pid.toString()).bold + " " + _this.Name);
            _this.Process = undefined;
            if (_this.Forever) {
                _this.Start();
            }
        });
    };
    ManagedProcess.prototype.IsChoking = function () {
        return this.chokeCounter > this.ChokeTolerance_MAX;
    };
    ManagedProcess.prototype.OnChoke = function () {
        this.emit("choke", this);
        warn(this.Name.bold + " CHOKING");
        this.chocking = true;
        return false;
    };
    ManagedProcess.prototype.ClearChoke = function () {
        this.chokeCounter = 0;
        this.chocking = false;
    };
    return ManagedProcess;
})(events.EventEmitter);
module.exports = ManagedProcess;
