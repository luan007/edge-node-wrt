var Node = require("Node");
var Core = require("Core");
var Tracker = require("./Tracker");
function UnixSocketToPort(TCP_PORT, UNIX_SOCKET, owner, cb, user) {
    if (user === void 0) { user = "nobody"; }
    trace("Binding Local Socket " + TCP_PORT + " <=> " + UNIX_SOCKET);
    var LOCAL = true;
    if (!Node.fs.existsSync(UNIX_SOCKET)) {
        return cb(new Error("Unix Socket NOT FOUND"));
    }
    if (!Node.fs.statSync(UNIX_SOCKET).isSocket()) {
        return cb(new Error("Not a socket :("));
    }
    var _root = Node.path.dirname(UNIX_SOCKET);
    var _file = Node.path.basename(UNIX_SOCKET);
    console.log(_root);
    console.log(_file);
    exec("chown", user, UNIX_SOCKET, function (err, result) {
        if (err)
            return cb(err);
        var portobj = {
            Port: TCP_PORT,
            Priority: 0,
            Stop: undefined,
            Owner: owner
        };
        Tracker.Use(portobj, function (err, result) {
            if (err)
                return cb(err);
            var socat = Node.child_process.spawn("socat", [
                "TCP-LISTEN:" + TCP_PORT + ",bind=127.0.0.1,reuseaddr,fork," + "chroot=" + _root + "," + (LOCAL ? "range=127.0.0.0/8" : ""),
                "UNIX-CLIENT:" + _file + ",setuid=" + "65534" + ","
            ]);
            socat.stderr.pipe(process.stdout);
            socat.stdout.pipe(process.stdout);
            portobj.Stop = function (cb) {
                try {
                    socat.kill();
                    cb();
                }
                catch (e) {
                }
            };
            socat.once("error", function (e) {
                error(e);
                Tracker.Release(TCP_PORT, function (err) {
                });
            });
            socat.once("exit", function () {
                fatal("[" + socat.pid + "] Port forwarder Exiting..");
                Tracker.Release(TCP_PORT, function (err) {
                });
            });
            info("Bound " + TCP_PORT + " <=> " + UNIX_SOCKET + " [" + socat.pid + "]");
            return cb(undefined, socat);
        });
    });
}
exports.UnixSocketToPort = UnixSocketToPort;
function AppSocketToPort(TCP_PORT, UNIX_PATH, cb) {
    var ctx = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!ctx)
        return cb(new Error("Who are you?"));
    var real = Node.path.join(ctx.GetAppRootPath(), UNIX_PATH);
    UnixSocketToPort(TCP_PORT, real, ctx.RuntimeId, function (err, result) {
        if (err)
            return cb(err);
        else {
            return cb(undefined, TCP_PORT);
        }
    });
}
exports.AppSocketToPort = AppSocketToPort;
__API(AppSocketToPort, "Port.Map", [10 /* PortExposure */]);
