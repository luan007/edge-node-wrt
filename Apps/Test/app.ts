/// <reference path="./global.d.ts" />


//SERVER = Server

import express = require("express");

console.log("Loading Test Application");
var app = express();

app.get("/", (req, res) => {
	res.json({result: "hi"});
});

Server.addListener('request', app);
