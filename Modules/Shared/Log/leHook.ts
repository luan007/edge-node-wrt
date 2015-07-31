var data = {}; //LRU?
var ticks = Date.now();
var MAX_LOG_LEN = 30000;


var events = require('events');
global.LOGHOOK = new events.EventEmitter();

export function Passthrough(name, stream){
	console.log("****** HOOKING STREAM - " + name + " ******");
	var old = stream.write;
	data[name] = [];	
	var intercept = function(str, enc, fd) {
		old.apply(stream, arguments);
		DoLog(name, str);
	}
}

export function DoLog(name, log){
	if(!data[name]) data[name] = [];
	data[name].unshift({D: log, T: (new Date()).toString(), rT: Date.now() - ticks });
	if(data[name].length > MAX_LOG_LEN) {
		data[name].pop();
	}
	global.LOGHOOK.emit('data', name, log);
}
