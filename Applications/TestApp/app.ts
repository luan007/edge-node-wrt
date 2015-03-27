//ps -p <pid> -o ppid=  
import fs = require("fs");
import util = require("util");
import http = require("http");

Server.on("request", function (req, res) {
    console.log("!");
    res.write("!");
});