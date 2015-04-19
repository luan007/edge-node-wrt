import net = require('net');
var Frap = require('frap');

var msg = {cmd: "print", args: ["hello", "world"]};

export function Connect() {
    var sk = net.createConnection(7000, function () {
        var frap = new Frap(sk)

        frap.on('data', function (buf) {
            var recv_msg = JSON.parse(buf.toString('utf8'))
            console.log("recv:", recv_msg)
            sk.end()
        })

        frap.write(JSON.stringify(msg), 'utf8')
    });
}