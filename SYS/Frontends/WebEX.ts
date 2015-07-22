//for safety sake, let's do a tunnel

import express = require('express');
import APIManager = require("../API/FunctionExposer");
var bodyParser = require('body-parser');
var app = express();
var _port = "/tmp/fdsock/webex";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/", (req, res)=>{
	res.json({
		result: "welcome"
	});
});

app.post("*", (req, res)=>{
	var p = req.path.toLowerCase();
	var d = p.trim().replace(/\//gim, '.');
	while(d[0] === '.'){
		d = d.substr(1);
	}
	while(d[d.length - 1] === '.'){
		d = d.substr(0, d.length - 1);
	}
	info('Web EX Call: ' + d);
	if(!APIManager.APIDict[d]) {
		return res.json({
			error: new Error("Not Found")
		});
	} else {
		var params = Array.isArray(req.body) ? req.body : [];
		params.push(must((err, result) => {
        	info("*WEBEX*  " + err + result);
			if (err) {
				return res.json({
					error: new Error("Not Found")
				});
			} else {
				return res.json({
					result: result
				});
			}
		}, 30000));
		//extract referer
		var mockRPC = {
			rpc: { remote: 0 },
			webex: {
				deviceid: req.header("edge-dev"),
				userid: req.header("edge-user")
			}
		};
		APIManager.APIDict[d].apply(mockRPC, params);
	}
});

export function Initialize(cb){
	info("Initializing WebEX");
	app.listen(_port, ()=>{
		exec("chmod", "777", _port);
		cb();
	});
}