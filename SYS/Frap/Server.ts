import net = require('net');
var Frap = require('frap');

export function Create() {
    var svr = net.createServer().listen(7000)
    svr.on('connection', function (sk) {
        var frap = new Frap(sk)
        frap.on('data', function (buf) {
            //simple echo
            frap.write(buf)
        });
    });
}