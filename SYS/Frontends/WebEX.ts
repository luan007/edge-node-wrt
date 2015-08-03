eval(LOG("Frontends:WebEX"));

//for safety sake, let's do a tunnel

import express = require('express');
import APIManager = require("../API/FunctionExposer");
var Busboy = require('busboy');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var _port = "/tmp/fdsock/webex";

app.post("/fd/:id", (req, res) => {
	PipeToWebFD(req.param('id'), req, res);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/", (req, res) => {
	res.json({
		result: "welcome"
	});
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
			error: 'Not Found'
		});
	} else {
		info(req.body);
		var params = [];
		if(req.body){
			for(var i in req.body){
				try{
					params.push(JSON.parse(req.body[i]));
				}catch(e){
					params.push(req.body[i]);
				}
			}
		}
		params.push(must((err, result) => {
			if (err) {
				return res.json({
					error: err.message ? err.message : err,
					stack: err.stack ? err.stack : []
				});
			} else {
				return res.json({
					result: result
				});
			}
		}, 20000));
		//extract referer
		var mockRPC = {
			rpc: { remote: 0 },
			webex: {
				deviceid: req.header("edge-dev"),
				userid: req.header("edge-user")
			},
			referer: req.header("referer")
		};
		try{
			APIManager.APIDict[d].apply(mockRPC, params);
		} catch (e) {
			params[params.length - 1](e);
		}
	}
});

function PipeToWebFD(id, req, res) {
	var end = once((err, result) => {
		if(err){
			res.json({
				error: err.message ? err.message : err,
				stack: err.stack ? err.stack : [],
			});	
		}else{
			res.json({
				result: result,
				success: "1"
			});	
		}
	});
	var target = id;
	if(!FIFO.all[id]) {
       	return end(new Error("Your FIFO is incorrect - " + target));
	}
	
	var one = 0;
	var busboy = new Busboy({ headers: req.headers });
	
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
	  info('FILE.. - ' + fieldname);
	  file.pipe(fs.createWriteStream("/tmp/fdsock/" + target));
	});
	
	busboy.on('finish', function() {
		end();
	});
	info('WEBFD.. - ' + id);
	req.pipe(busboy);
	// info("PIPE START!!! " + target);
	// var file = fs.createWriteStream("/tmp/fdsock/" + target);
	// part.pipe(file);
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