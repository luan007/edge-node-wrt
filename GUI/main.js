/* global TweenLite */
/// <reference path="../typings/jquery/jquery.d.ts"/>
/* global API */
//remember, this crap runs in BROWSER CONTEXT so plz be careful with errors


/* RPC kinda logic */

var os = require('os');
var fs = require('fs');
var net = require('net');
var rpc = require("../Modules/RPC/index");
var events = require('events');
var exec = require('child_process').exec;
window.jQuery = window.$ = require("./jquery-2.1.3.js");
var Velocity = require("./Velocity.js");
require("./TweenLite.js");
var GUIProcess = window.GUIProcess = global.GUIPrcoess = new events.EventEmitter();

window.API = global.API = undefined;

(function () {
	fs.writeFileSync('/var/GUI', process.pid);
	var task;
	var last_ready = 0;
	function reconnect() {
		if (last_ready) {
			GUIProcess.emit('loading');
			last_ready = 0;
		}
		clearTimeout(task);
		task = setTimeout(conntask, 500);
	}
	function conntask() {
		try {
			if (fs.existsSync('/var/GUI_sock')) {
				var _api = JSON.parse(fs.readFileSync('/var/GUI_sock').toString());
				var _rpc;
				var sock = net.connect(_api.port, function (err, result) {
					if (err) {
						reconnect();
					}
					else {
						_rpc = new rpc.RPCEndpoint(sock);
						last_ready = 1;
						sock.once('error', reconnect).once('end', reconnect).once('close', reconnect);
						var _api_full = rpc.APIManager.GetAPI(_api, _rpc);
						global.API = API = _api_full.API;
						GUIProcess.emit('load');
					}
				}).once('error', reconnect).once('end', reconnect).once('close', reconnect);
			} else {
				reconnect();
			}
		} catch (e) {
			reconnect();
		}
	}
	conntask();
})();

var block = $("#main");
var online = $("#online");
var total = $("#total");
var mem = $("#mem");
var uplink = $("#uplink");

GUIProcess.on('loading', function () {
	block.css('display', 'none');
});

GUIProcess.on('load', function () {
	block.css('display', 'block');
	push("SYSTEM CONNECTED");
	API.RegisterEvent(["Stat.set", "Device.up", "Device.down"], function(err, result){
		if(err){
			push(err ? "ERR": "" + " " + err.message, 1);
		}
		else{
			push("Event Registered", 1);
		}
		
		
		API.Stat.on('set', function(key, v, old, n){
			push(key + " - " + v + "<br>" + n);
		});
		API.Stat.on('del', function(key, v, old, n){
			push('DEL' + '*' + key + " - " + v + "<br>" + n, "#e00");
		});
		// API.Stat.Get('NETWORK.link.eth2', function(err, result){
		// 	uplink.html(Object.keys(result));
		// });
		API.Stat.Get('NETWORK.addr.eth2', function(err, result){
			uplink.html(JSON.stringify(result[0])); 
		});
		function update(){
			push("- DEVICE UPDATE -", "#dd6");
			API.Device.All(function(err, result){
				if(err){
					push(err ? "ERR": "" + " " + err.message, 1);
				}
				else{
					var count = 0;
					for(var i in result){
						count += result[i].state;
					}
					online.html('' + count);
					total.html('' + Object.keys(result).length);
				}
			});
		}
		update();
		API.Device.on('up', update);
		API.Device.on('down', update);
	});
});
//GUI Stuff..?

setInterval(function(){
	exec("free | awk 'FNR == 3 {print $3/($3+$4)*100}'", function(err, r, d){
		try{
			var vm = parseInt(r.toString());
			mem.html('' + vm + "%");
			if(vm > 90) {
				mem.css('color', '#f00');
			}
			else if(vm > 70) {
				mem.css('color', '#990');
			}
			else {
				mem.css('color', '#4a0');
			}
		}
		catch(e) {
			push('Failed to Load Memory<br>' + e.message, 1);
		}
	});
}, 1000);

var logarea = $("#log-area");
var insertpoint = $("#insert-point");
function push(log, warn) {
	if(!log) return;
	// logarea.add()
	var d = $("<h5>" + log + "</h5>");
	d.insertAfter(insertpoint);
	var color = warn ? "#f00" : "#555";
	if(warn && warn.length) color = warn;
	d.css("color", color);
	var fin = logarea.children().get(4);
	if(fin) fin.remove();
}