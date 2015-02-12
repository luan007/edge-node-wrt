import child_process = require("child_process");
import net = require("net");

var sockPath = process.env.sockPath ? process.env.sockPath : "/tmp/umount_guard.sock";


import fs = require("fs");
if (fs.existsSync(sockPath)) {
    fs.unlinkSync(sockPath);
}

net.createServer((sock) => {
    var path = "";
    sock.on("data", (data) => {
        path += data.toString();
    });

    sock.on("end", () => {
        child_process.spawn("fusermount", ["-u", path], {});
        child_process.spawn("umount", [path], {});
        console.log(path);
    });

    sock.on("error", (err) => {
        console.log(err);
    });
}).listen(sockPath, () => {
    fs.chmodSync(sockPath, parseInt("0777", 8));
});
