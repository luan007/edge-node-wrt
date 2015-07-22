//for safety sake, let's do a tunnel

import express = require('express');
import APIManager = require("../API/FunctionExposer");
var app = express();
var _port = "/tmp/fdsock/webex";

app.get("/", (req, res)=>{
	res.json({
		result: "welcome"
	});
});

app.get("*", (req, res)=>{
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
		var params = [];
		for(var i in req.query){
		 	params.push(req.query[i]);
	 	} 
		//DOES NOT WORK
		
		//MUST HAS BUGS
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
			rpc: { remote: 0 }
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