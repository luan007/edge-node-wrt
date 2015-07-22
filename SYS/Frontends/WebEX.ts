//for safety sake, let's do a tunnel

import express = require('express');
import APIManager = require("../API/FunctionExposer");
var multiparty = require('multiparty');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var _port = "/tmp/fdsock/webex";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/", (req, res) => {
	res.json({
		result: "welcome"
	});
});

app.post("/fd", (req, res) => {
	
});

app.post("*", (req, res) => {
	var p = req.path.toLowerCase();
	var d = p.trim().replace(/\//gim, '.');
	while (d[0] === '.') {
		d = d.substr(1);
	}
	while (d[d.length - 1] === '.') {
		d = d.substr(0, d.length - 1);
	}
	info('Web EX Call: ' + d);
	if (!APIManager.APIDict[d]) {
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
			},
			referer: req.header("referer")
		};
		APIManager.APIDict[d].apply(mockRPC, params);
	}
});

function PipeToWebFD(req, res) {
    var form = new multiparty.Form();
	var end = once((err, result) => {
		res.json({
			err: err,
			result: result
		});	
	});
	var one = 0;
    form.on('error', function(err) {
        return end(err);
    });
	form.on('part', function(part) {
		one++;
		if(one > 1) return end(new Error("Multiple Upload is rejected"));
		var target = part.filename;
		if(FIFO.all[target] && FIFO.all[target].owner === "WEB"){
			var file = fs.createWriteStream("/tmp/fdsock/" + target);
			part.pipe(file);
		} else {
        	return end(new Error("Your FIFO is incorrect"));
		}
		//part.pipe(fs.createWriteStream(part.filename));
		part.on('error', function(err) {
        	return end(err);
		});
	});
	form.on('close', function() {
        return end();
	});
}

function CreateWebFD(cb) {
	if (this.webex) {
		FIFO.CreateSource("WEB", "/tmp/fdsock", (err, result) => {
			if (err) return cb(err);
			else {
				return cb(undefined, result);
			}
		});
	}
}

export function Initialize(cb) {
	info("Initializing WebEX");
	app.listen(_port, () => {
		exec("chmod", "777", _port);
		cb();
	});
}

__API(CreateWebFD, "IO.CreateWebFD");