//ps -p <pid> -o ppid=  
import fs = require("fs");
import util = require("util");
import http = require("http");

Server.on("request", (req, res) => {
    res.write("!");
    res.end();
});