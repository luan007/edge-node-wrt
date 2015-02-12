import Node = require("Node");
import Core = require("Core");

import Tracker = require("./Tracker");

//var socats = {};

//socat TCP-LISTEN:1234,bind=127.0.0.1,reuseaddr,fork,su=nobody,range=127.0.0.0/8 UNIX-CLIENT:/tmp/foo
//http://stackoverflow.com/questions/2149564/redirecting-tcp-traffic-to-a-unix-domain-socket-under-linux
export function UnixSocketToPort(TCP_PORT, UNIX_SOCKET, owner, cb, user= "nobody") {
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
    //user = owner;
    exec("chown", user, UNIX_SOCKET, (err, result) => {
        if (err) return cb(err);
        var portobj: Tracker.PortStatus = {
            Port: TCP_PORT,
            Priority: 0,
            Stop: undefined,
            Owner: owner
        };

        //TODO: Use iptables to secure local port with PID filter
        Tracker.Use(portobj, (err, result) => {
            if (err) return cb(err);
            //https://coderwall.com/p/c3wyzq/forwarding-tcp-traffic-to-a-unix-socket
            var socat = Node.child_process.spawn("socat", [ 
                "TCP-LISTEN:" + TCP_PORT + ",bind=127.0.0.1,reuseaddr,fork," + "chroot=" + _root + "," +
                (LOCAL ? "range=127.0.0.0/8" : ""),
                "UNIX-CLIENT:" + _file +
                ",setuid=" + "65534" + ","
            ]);
            socat.stderr.pipe(process.stdout);
            socat.stdout.pipe(process.stdout);

            portobj.Stop = function (cb) {
                try {
                    socat.kill();
                    cb();
                } catch (e) { /*swallow*/ }
            }
            //socats[TCP_PORT] = socat;
            socat.once("error", (e) => {
                error(e);
                Tracker.Release(TCP_PORT, (err) => { });
            });
            socat.once("exit", () => {
                fatal("[" + socat.pid + "] Port forwarder Exiting..");
                Tracker.Release(TCP_PORT, (err) => { });
            });

            info("Bound " + TCP_PORT + " <=> " + UNIX_SOCKET + " [" + socat.pid + "]");
            return cb(undefined, socat);
        });
    });
}

export function AppSocketToPort(TCP_PORT, UNIX_PATH, cb) {
    var ctx = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!ctx) return cb(new Error("Who are you?"));
    var real = Node.path.join(ctx.GetAppRootPath(), UNIX_PATH);
    UnixSocketToPort(TCP_PORT, real, ctx.RuntimeId, (err, result) => {
        if (err) return cb(err);
        else {
            return cb(undefined, TCP_PORT);
        }
    });
}

__API(AppSocketToPort, "Port.Map", [Permission.PortExposure]);