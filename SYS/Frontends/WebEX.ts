//for safety sake, let's do a tunnel

import express = require('express');
import APIManager = require("../API/FunctionExposer");
var app = express();
var port = "/var/webex";

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
		res.status(404).json({
			error: new Error("Not Found")
		});
	} else {
		var params = [];
		for(var i in req.params){
			params.push(req.params[i]);
		}
		params.push(must((err, result) => {
			if (err) {
				return res.status(500).json({
					error: new Error("Not Found")
				});
			} else {
				return res.status(200).json({
					result: result
				});
			}
		}, 50000));
		//extract referer
		var mockRPC = {
			remote: 0
		};
		APIManager.APIDict[d].apply(mockRPC, params);
	}
});

function Initialize(cb){
	app.listen(port);
	cb();
}