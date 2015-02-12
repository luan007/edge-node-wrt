import Core = require("Core");
import Node = require("Node");

import http = require("http");

SYS_ON(SYS_EVENT_TYPE.LOADED, () => {

    http.createServer((req, res) => {
        res.write("hi");
        res.end();
    }).listen("/tmp/test.sock", () => {

        Core.SubSys.Ports.Redirector.UnixSocketToPort("9999", "/tmp/test.sock", "", (err, result) => {
            if (err) error(err);
            else {

            }
        }); 
        setTimeout(() => {

            Core.SubSys.Ports.Redirector.UnixSocketToPort("9999", "/tmp/test.sock", "",  (err, result) => {
                if (err) error(err);
                else {

                }
            }); 
        }, 4000);
    });

});