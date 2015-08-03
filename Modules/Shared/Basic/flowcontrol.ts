import events = require("events");

var runningJobs = {};
global.ignore_if_running = function (jobName, job: (cb) => any, swallow_cb = false, error_if_bypassed = false){
    return function(cb) {
        if(runningJobs[jobName]){
            if(swallow_cb) return;
            return cb(error_if_bypassed ? new Error("Job: " + jobName + " is currently running ! ") : undefined, undefined);
        }
        runningJobs[jobName] = 1;
        var wrapCb = function() {
            delete runningJobs[jobName];
            cb.apply(this, arguments);
        }
        job(wrapCb);
    };
};

global.retry_times = function (someJob_with_CB: (cb: (err,result)=>any) => any, max_retry = 10, delay = 100) {
    return function(cb) {
        var t = undefined;
        var retry = function(){
            someJob_with_CB((err, result)=>{
                clearTimeout(t);
                if(!err) return cb(err, result);
                if(max_retry === 0){
                    err.retried = true;
                    return cb(err);
                }
                if(max_retry > 0){
                    max_retry--;
                }
                t = setTimeout(retry, delay);
            });
        }
        retry();
    };
};

global.withCb = function (syncFunc, resultfilter?) {
    return function () {
        var cb = arguments[arguments.length - 1];
        delete arguments[arguments.length - 1];
        var result = void 0;
        var error = void 0;
        try {
            result = syncFunc.apply(this, arguments);
            if(resultfilter) result = resultfilter(result);
        } catch (e) {
            error = e;
        }
        process.nextTick(() => {
            cb(error, result);
        });
    };
};

global.once = function (func: Function) {
    var wrapper = function() {
        var flag = Math.random().toString();
        if (wrapper[flag] == 1) {
            //do nothing
        }
        else {
            wrapper[flag] = 1;
            func.apply(null, arguments);
        }
    }
    return wrapper;
};

global.emitterizeCb = function (_this, job: Function, ...args) {
    var emitter = new events.EventEmitter();
    var cb = args[args.length - 1];
    args[args.length - 1] = (...params) => {
        if (emitter) {
            emitter.emit.apply(emitter, ["trigger"].concat(params));
        }
    };
    emitter.once("trigger", function() {
        cb.apply(null, arguments);
        cb = undefined;
        emitter.removeAllListeners();
        emitter = undefined;
    });
    job.apply(_this, args);
};

global.must = function (cb: Function, timeout = 20000, ...defaultargs) {
    var tclock = -1;
    var flag = Math.random().toString();
    var wrapper: Function = function () {
        if (wrapper[flag] == 1) {
            //do nothing
        }
        else {
            wrapper[flag] = 1;
            clearTimeout(tclock);
            cb.apply(null, arguments);
        }
    };
    tclock = <any>setTimeout(() => {
        wrapper.apply(null, [new Error("Operation Time-out")].concat(defaultargs));
    }, timeout);
    return wrapper;
};

global.withdefault = function (func: Callback, result_default) {
    var wrapper = (err, result) => {
        func(err, result === undefined ? result_default : result);
    };
    return wrapper;
};

global.ignore_err = function (func: Callback) {
    var wrapper = function () {
        arguments[0] = undefined;
        func.apply(undefined, arguments);
    };
    return wrapper;
};

global.untilNoError = function (job: (done) => any) {
    var wrapper = (main_cb) => {
        job((err, result) => {
            if (!err) {
                main_cb(err, result);
            }
            else {
                wrapper(main_cb);
            }
        });
    };
    return wrapper;
}


var _queue: IDic<Array<any>> = {};

function runQueue(name) {
    if (!_queue[name] || _queue[name].length == 0) {
        _queue[name] = undefined; //ended
    } else {
        var step = _queue[name].shift();
        step[0](function () {
            //console.log(bane 
            step[1].apply(undefined, arguments);
            runQueue(name);
        });
    }
}

global.intoQueue = function (name, job, cb) {
    if (!_queue[name]) {
        _queue[name] = [];
        _queue[name].push([job, cb]);
        //kick start
        runQueue(name);
        return 1;
    }
    else {
        return _queue[name].push([job, cb]);
    }
}


var _heap: IDic<Array<any>> = {};
var _job_ongoing: IDic<Array<any>> = {};
var _pending_hotswap: IDic<Array<Function>> = {};

global.hotswapSafe = function (name, cb: Function, job: (done: Function) => any) {

    if (!_job_ongoing[name]) {
        _job_ongoing[name] = [];
        _job_ongoing[name]["l"] = 0;
    }
    var index = _job_ongoing[name].push(1);
    _job_ongoing[name]["l"]++;

    var done = must(once( function () {
        _job_ongoing[name][index] = undefined;
        _job_ongoing[name]["l"]--;
        if (_job_ongoing[name]["l"] <= 0) {
            _job_ongoing[name] = []; //release :p
            _job_ongoing[name]["l"] = 0;
            //go hotswap
        }
        cb.apply(undefined, arguments);
        if (_job_ongoing[name]["l"] - (!_heap[name] ? 0 : _heap[name].length) <= 0) {
            doHotswap(name);
        }
    }));

    if (_pending_hotswap[name]) {
        //push into heap
        if (!_heap[name]) {
            _heap[name] = [];
        }
        _heap[name].push(() => { job(done); });
    }
    else {
        //immediate execution
        job(done);
    }
    return _job_ongoing[name]["l"];
}

function doHotswap(name) {
    if (!_pending_hotswap[name] || _pending_hotswap[name].length == 0) {
        _pending_hotswap[name] = undefined;
        //GO HEAPPP
        if (_heap[name]) {
            var len = _heap[name].length;
            for (var i = 0; i < len; i++) {
                    (_heap[name].pop())();
            }
        }
        return;
    }
    var job = _pending_hotswap[name][0];
    job(() => {
        _pending_hotswap[name].shift();
        doHotswap(name);
    });
}

global.hotswap = function (name, _safe_to_swap_now: (done: Function) => any) {
    if (!_pending_hotswap[name]) {
        _pending_hotswap[name] = [];
    }
    _pending_hotswap[name].push(once(_safe_to_swap_now)); //flag, pends up all requests
    if (!_job_ongoing[name] || _job_ongoing[name].length == 0)
    {
        doHotswap(name);
        return true;
    }
    return false;
}


var _job = {};
var _task = {};
var _task_with_cb = {};

/*setInterval*/
global.setJob = function (name, job, interval, ...args) {
    clearJob(name);
    _job[name] = setInterval.apply(undefined, [job, interval].concat(args));
    return name;
};

global.clearJob = function (name) {
    if (_job[name] !== undefined) {
        //cancel
        clearInterval(_job[name]);
        _job[name] = undefined;
        return true;
    }
    return false;
};

/*setTimeout*/
global.setTask = function (name, task, timeout, ...args) {
    clearTask(name);
    _task[name] = setTimeout.apply(undefined, [task, timeout].concat(args));
    return name;
};

global.clearTask = function (name) {
    if (_task[name] !== undefined) {
        //cancel
        clearTimeout(_task[name]);
        _task[name] = undefined;
        return true;
    }
    return false;
};

global.setTaskWithCb = function (name, task: (cb)=>any, timeout, realCb = (err, result?) => {}, ignoreIfRunning = false) {
    if(_task_with_cb[name] && _task_with_cb[name].isRunning){
        if(ignoreIfRunning){
            realCb(new Error("Task is Running"));
            return false;
        } else {
            if(_task_with_cb[name].next){
                return _task_with_cb[name].next.realCb(new Error("Task has been replaced"));
            }
            return _task_with_cb[name].next = {
                timeout: timeout,
                task: task,
                realCb: realCb
            };
        }
    }
    clearTaskWithCb(name);
    if(!_task_with_cb[name]){
        _task_with_cb[name] = {
            isRunning: false,
            realCb: realCb,
            next: undefined,
            timer: undefined
        };
    }
    
    var wrapper:any = function(){
        if(wrapper.guard) return; 
        realCb.apply(this, arguments);
        wrapper.guard = true;
        clearTimeout(_task_with_cb[name].timer);
        var q = _task_with_cb[name].next;
        _task_with_cb[name] = undefined;
        if(q){
            setTaskWithCb(name, q.task, q.timeout, false);
        }
    };
    
    var task_wrapper = function(cb){
        _task_with_cb[name].isRunning = true;
        return task(cb);
    };
    
    _task_with_cb[name].timer = setTimeout(task_wrapper, timeout, wrapper);
    return name;
};

global.clearTaskWithCb = function (name) {
    if(_task_with_cb[name] && !_task_with_cb[name].isRunning){
        clearTimeout(_task_with_cb[name].timer);
        _task_with_cb[name].realCb(new Error("Task has been Canceled"));
        if(_task_with_cb[name].next && _task_with_cb[name].next.realCb){
            _task_with_cb[name].next.realCb(new Error("Task has been Canceled"));
        }
        _task_with_cb[name] = undefined;
        return true;
    }
    return false;
};



global.async = require("async");

global._ = require("underscore");
