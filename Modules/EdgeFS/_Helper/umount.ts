import child_process = require("child_process");
var fork = child_process.fork;
var _path = "/tmp/umount_guard.sock";
import net = require("net");

export function SetKillGuardPath(path) {
    if (path) {
        _path = path;
    }
}

export function umount(path, cb) {
    var socket = net.connect(_path);
    socket.write(path);
    socket.end(() => {
        socket.destroy();
        cb();
    });
    //fork("/nfs/Modules/EdgeFS/_Helper/dropper.js", [], {
    //    env: {
    //        t: 0, p: path
    //    }
    //});

    //child_process.exec("( ( (sleep 2; echo $PPID > 1 ) & ) & )", (err, out, std) => {
    //    console.log("done");
    //});

    //var result = syscall.umount(path);
    //var result = syscall.umount(path);
}