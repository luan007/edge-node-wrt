
eval(LOG("Common:Native:mdns"));

global.mdns = require("mdns");

var mdns = require('mdns-js');
mdns.excludeInterface('0.0.0.0');

var events = require("events");

var LISTEN_PORT = "br0";

export var Emitter = new events.EventEmitter();

export function Initialize(cb) {
	
	//generic
	var main = mdns.createBrowser();
	
	var cache = {};
	
	function discover_service(_type){
		if(cache[_type]){
			return;
			return cache[_type].discover(); 
		}
		info("Worker Added: " + _type);
		var worker = mdns.createBrowser(_type); 
		cache[_type] = worker;
		
		worker.on("ready", function(){
			info("Worker " + _type + " READY ");
			worker.discover();
			setInterval(function(){
				worker.discover(); 
			}, 15000);
		});
	}
	
	
	main.on("ready", function(){
		main.discover();
		setInterval(function(){
			main.discover();
		}, 15000);
	});
	
	var host_service_table = {};
	
	main.on("update", function(d){
		var iface = d.networkInterface;
		if(iface !== LISTEN_PORT) return;
		if(d.fullname || d.port || d.txt) {
			//filter txt
			if(d['txt']){
				var bk = d.txt;
				d.txtRecord = {};
				for(var i = 0; i < bk.length; i++){
					var p = bk[i];
					var q = p.split("=");
					d.txtRecord[q[0]] = q[1];
				}
			}
			d.type = d.type[0];
			
			if(!host_service_table[d.host]) host_service_table[d.host] = {};
			//This is a full DNS record
			//trace(d.type);
			if(!host_service_table[d.host][d.fullname] || 
				JSON.stringify(host_service_table[d.host][d.fullname]) !== JSON.stringify(d)){
				host_service_table[d.host][d.fullname] = d;
				for(var i = 0; i < d.addresses.length; i++){
					Emitter.emit("serviceUp", d.addresses[i], d);
				}
			}
		}
		else {
			for(var t = 0; t < d.type.length; t++){
				var q = d.type[t];
				var full = "_" + q.name + "._" + q.protocol;
				discover_service(full);
			}
		}
	});
	return cb();

}
