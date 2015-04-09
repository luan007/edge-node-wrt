var Core = require("Core");
var http = require("http");
SYS_ON(0 /* LOADED */, function () {
    http.createServer(function (req, res) {
        res.write("hi");
        res.end();
    }).listen("/tmp/test.sock", function () {
        Core.SubSys.Ports.Redirector.UnixSocketToPort("9999", "/tmp/test.sock", "", function (err, result) {
            if (err)
                error(err);
            else {
            }
        });
        setTimeout(function () {
            Core.SubSys.Ports.Redirector.UnixSocketToPort("9999", "/tmp/test.sock", "", function (err, result) {
                if (err)
                    error(err);
                else {
                }
            });
        }, 4000);
    });
});
