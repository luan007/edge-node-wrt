var events = require("events");
global.withCb = function (syncFunc) {
    return function () {
        var cb = arguments[arguments.length - 1];
        delete arguments[arguments.length - 1];
        var result = void 0;
        var error = void 0;
        try {
            result = syncFunc.apply(null, arguments);
        }
        catch (e) {
            error = e;
        }
        process.nextTick(function () {
            cb(error, result);
        });
    };
};
global.once = function (func) {
    var wrapper = function () {
        var flag = Math.random().toString();
        if (wrapper[flag] == 1) {
        }
        else {
            wrapper[flag] = 1;
            func.apply(null, arguments);
        }
    };
    return wrapper;
};
global.emitterizeCb = function (_this, job) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var emitter = new events.EventEmitter();
    var cb = args[args.length - 1];
    args[args.length - 1] = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        if (emitter) {
            emitter.emit.apply(emitter, ["trigger"].concat(params));
        }
    };
    emitter.once("trigger", function () {
        cb.apply(null, arguments);
        cb = undefined;
        emitter.removeAllListeners();
        emitter = undefined;
    });
    job.apply(_this, args);
};
global.must = function (cb, timeout) {
    if (timeout === void 0) { timeout = 20000; }
    var defaultargs = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        defaultargs[_i - 2] = arguments[_i];
    }
    var tclock = -1;
    var flag = Math.random().toString();
    var wrapper = function () {
        if (wrapper[flag] == 1) {
        }
        else {
            wrapper[flag] = 1;
            clearTimeout(tclock);
            cb.apply(null, arguments);
        }
    };
    tclock = setTimeout(function () {
        wrapper.apply(null, [new Error("Operation Time-out")].concat(defaultargs));
    }, timeout);
    return wrapper;
};
global.withdefault = function (func, result_default) {
    var wrapper = function (err, result) {
        func(err, result === undefined ? result_default : result);
    };
    return wrapper;
};
global.ignore_err = function (func) {
    var wrapper = function () {
        arguments[0] = undefined;
        func.apply(undefined, arguments);
    };
    return wrapper;
};
global.untilNoError = function (job) {
    var wrapper = function (main_cb) {
        job(function (err, result) {
            if (!err) {
                main_cb(err, result);
            }
            else {
                wrapper(main_cb);
            }
        });
    };
    return wrapper;
};
var _queue = {};
function runQueue(name) {
    if (!_queue[name] || _queue[name].length == 0) {
        _queue[name] = undefined;
    }
    else {
        var step = _queue[name].shift();
        step[0](function () {
            step[1].apply(undefined, arguments);
            runQueue(name);
        });
    }
}
global.intoQueue = function (name, job, cb) {
    if (!_queue[name]) {
        _queue[name] = [];
        _queue[name].push([job, cb]);
        runQueue(name);
        return 1;
    }
    else {
        return _queue[name].push([job, cb]);
    }
};
var _heap = {};
var _job_ongoing = {};
var _pending_hotswap = {};
global.hotswapSafe = function (name, cb, job) {
    if (!_job_ongoing[name]) {
        _job_ongoing[name] = [];
        _job_ongoing[name]["l"] = 0;
    }
    var index = _job_ongoing[name].push(1);
    _job_ongoing[name]["l"]++;
    var done = must(once(function () {
        _job_ongoing[name][index] = undefined;
        _job_ongoing[name]["l"]--;
        if (_job_ongoing[name]["l"] <= 0) {
            _job_ongoing[name] = [];
            _job_ongoing[name]["l"] = 0;
        }
        cb.apply(undefined, arguments);
        if (_job_ongoing[name]["l"] - (!_heap[name] ? 0 : _heap[name].length) <= 0) {
            doHotswap(name);
        }
    }));
    if (_pending_hotswap[name]) {
        if (!_heap[name]) {
            _heap[name] = [];
        }
        _heap[name].push(function () {
            job(done);
        });
    }
    else {
        job(done);
    }
    return _job_ongoing[name]["l"];
};
function doHotswap(name) {
    if (!_pending_hotswap[name] || _pending_hotswap[name].length == 0) {
        _pending_hotswap[name] = undefined;
        if (_heap[name]) {
            var len = _heap[name].length;
            for (var i = 0; i < len; i++) {
                (_heap[name].pop())();
            }
        }
        return;
    }
    var job = _pending_hotswap[name][0];
    job(function () {
        _pending_hotswap[name].shift();
        doHotswap(name);
    });
}
global.hotswap = function (name, _safe_to_swap_now) {
    if (!_pending_hotswap[name]) {
        _pending_hotswap[name] = [];
    }
    _pending_hotswap[name].push(once(_safe_to_swap_now));
    if (!_job_ongoing[name] || _job_ongoing[name].length == 0) {
        doHotswap(name);
        return true;
    }
    return false;
};
var _job = {};
var _task = {};
global.setJob = function (name, job, interval) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    clearJob(name);
    _job[name] = setInterval.apply(undefined, [job, interval].concat(args));
    return name;
};
global.clearJob = function (name) {
    if (_job[name] !== undefined) {
        clearInterval(_job[name]);
        _job[name] = undefined;
        return true;
    }
    return false;
};
global.setTask = function (name, task, timeout) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    clearTask(name);
    _task[name] = setTimeout.apply(undefined, [task, timeout].concat(args));
    return name;
};
global.clearTask = function (name) {
    if (_task[name] !== undefined) {
        clearTimeout(_task[name]);
        _task[name] = undefined;
        return true;
    }
    return false;
};
global.async = require("async");
global._ = require("underscore");
