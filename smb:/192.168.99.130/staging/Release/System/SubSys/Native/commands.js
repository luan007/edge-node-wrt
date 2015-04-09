var child_process = require("child_process");
var events = require("events");
global.exec = function (cmd) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var cb = typeof (args[args.length - 1]) === "function" ? args.pop() : function () {
    };
    if (CONF.ENABLE_EXEC_QUEUEING) {
        var jobs = intoQueue("exec_" + cmd, args.length == 0 ? child_process.exec.bind(null, cmd, {}) : child_process.execFile.bind(null, cmd, args, {}), function (err, stdio, stderr) {
            if (err || (stderr && stderr.length > 0)) {
                if (CONF.CMD_DEBUG)
                    warn(err ? err : new Error(stderr.toString()));
                return cb(err ? err : new Error(stderr.toString()), stdio.toString(), stderr.toString());
            }
            return cb(undefined, stdio.toString(), stderr.toString());
        });
        if (CONF.CMD_DEBUG)
            trace(cmd.cyan.bold + " " + args.toString() + " @" + jobs);
    }
    else {
        if (CONF.CMD_DEBUG)
            trace(cmd.cyan.bold + " " + args.toString());
        var j = args.length == 0 ? child_process.exec.bind(null, cmd, {}) : child_process.execFile.bind(null, cmd, args, {});
        j(function (err, stdio, stderr) {
            if (err || (stderr && stderr.length > 0)) {
                if (CONF.CMD_DEBUG)
                    warn(err ? err : new Error(stderr.toString()));
                return cb(err ? err : new Error(stderr.toString()), stdio.toString(), stderr.toString());
            }
            return cb(undefined, stdio.toString(), stderr.toString());
        });
    }
};
global.umount_till_err = function (name, callback) {
    exec("umount", "-lf", name, function (err, result) {
        if (!err) {
            umount_till_err(name, callback);
        }
        else {
            return callback(undefined, err);
        }
    });
};
global.umount = function (name, callback) {
    exec("umount", "-lf", name, callback);
};
global.mount_auto = function (src, target, args, callback) {
    umount_till_err(target, function (err, result) {
        if (err)
            return callback(err, result);
        exec.apply(undefined, ["mount"].concat(args, [src, target, callback]));
    });
};
global.killall = function (name, callback) {
    exec("killall", name, callback);
};
global.modprobe = function (mod, args, callback) {
    exec("modprobe", mod, args, callback);
};
global.modprobe_r = function (mod, callback) {
    exec("modprobe", "-r", mod, callback);
};
global.insmod = function (mod, args, callback) {
    exec("insmod", mod, args, callback);
};
global.rmmod = function (mod, callback) {
    exec("rmmod", mod, callback);
};
global.parsespawn = function (command, args) {
    return parsespawn_full(command, args).event;
};
global.parsespawn_full = function (command, args) {
    var emitter = new events.EventEmitter();
    var proc = child_process.spawn(command, args);
    var stdout_last = "";
    var stderr_last = "";
    proc.stdout.on("data", function (data) {
        var cur = data.toString() + "";
        var lines = cur.split("\n");
        if (lines.length > 0) {
            emitter.emit("out_line", stdout_last + lines[0]);
            stdout_last = "";
        }
        for (var i = 1; i < lines.length - 1; i++) {
            emitter.emit("out_line", lines[i]);
        }
        if (lines.length > 0) {
            stdout_last = lines[lines.length - 1];
        }
    });
    proc.stderr.on("data", function (data) {
        var cur = data.toString() + "";
        var lines = cur.split("\n");
        if (stderr_last !== "" && lines.length > 0) {
            emitter.emit("err_line", stderr_last + lines[0]);
            stderr_last = "";
        }
        for (var i = 1; i < lines.length - 1; i++) {
            emitter.emit("err_line", lines[i]);
        }
        if (lines.length > 0) {
            stderr_last = lines[lines.length - 1];
        }
    });
    proc.on("exit", function () {
        if (stdout_last !== "") {
            emitter.emit("err_line", stdout_last);
        }
        if (stderr_last !== "") {
            emitter.emit("err_line", stderr_last);
        }
        emitter.emit("exit");
    });
    return {
        event: emitter,
        process: proc
    };
};
