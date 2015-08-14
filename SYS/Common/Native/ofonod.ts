//black magic ahead :p
//controls your phone

//NOTE: THIS ONLY WORKS WITH *.12 VERSION - TEST REQUIRED
eval(LOG("Common:Native:ofonod"));


/**
 * 
 * #!/usr/bin/python3

from gi.repository import GLib

import dbus
import dbus.mainloop.glib

_dbus2py = {
	dbus.String : str,
	dbus.UInt32 : int,
	dbus.Int32 : int,
	dbus.Int16 : int,
	dbus.UInt16 : int,
	dbus.UInt64 : int,
	dbus.Int64 : int,
	dbus.Byte : int,
	dbus.Boolean : bool,
	dbus.ByteArray : str,
	dbus.ObjectPath : str
    }

def dbus2py(d):
	t = type(d)
	if t in _dbus2py:
		return _dbus2py[t](d)
	if t is dbus.Dictionary:
		return dict([(dbus2py(k), dbus2py(v)) for k, v in d.items()])
	if t is dbus.Array and d.signature == "y":
		return "".join([chr(b) for b in d])
	if t is dbus.Array or t is list:
		return [dbus2py(v) for v in d]
	if t is dbus.Struct or t is tuple:
		return tuple([dbus2py(v) for v in d])
	return d

def pretty(d):
	d = dbus2py(d)
	t = type(d)

	if t in (dict, tuple, list) and len(d) > 0:
		if t is dict:
			d = ", ".join(["%s = %s" % (k, pretty(v))
					for k, v in d.items()])
			return "{ %s }" % d

		d = " ".join([pretty(e) for e in d])

		if t is tuple:
			return "( %s )" % d

	if t is str:
		return "%s" % d

	return str(d)

def property_changed(name, value, path, interface):
	iface = interface[interface.rfind(".") + 1:]
	print("{%s} [%s] %s = %s" % (iface, path, name, pretty(value)))

def added(name, value, member, path, interface):
	iface = interface[interface.rfind(".") + 1:]
	print("{%s} [%s] %s %s" % (iface, member, name, pretty(value)))

def removed(name, member, path, interface):
	iface = interface[interface.rfind(".") + 1:]
	print("{%s} [%s] %s" % (iface, name, member))

def event(member, path, interface):
	iface = interface[interface.rfind(".") + 1:]
	print("{%s} [%s] %s" % (iface, path, member))

def message(msg, args, member, path, interface):
	iface = interface[interface.rfind(".") + 1:]
	print("{%s} [%s] %s %s (%s)" % (iface, path, member,
					msg, pretty(args)))

def network_time_changed(time, member, path, interface):
	iface = interface[interface.rfind(".") + 1:]
	print("{%s} [%s] %s %s" % (iface, path, member, pretty(time)))

def ussd(msg, member, path, interface):
	iface = interface[interface.rfind(".") + 1:]
	print("{%s} [%s] %s %s" % (iface, path, member, msg))

def value(value, member, path, interface):
	iface = interface[interface.rfind(".") + 1:]
	print("{%s} [%s] %s %s" % (iface, path, member, str(value)))

if __name__ == '__main__':
	dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)

	bus = dbus.SystemBus()

	bus.add_signal_receiver(property_changed,
				bus_name="org.ofono",
				signal_name = "PropertyChanged",
				path_keyword="path",
				interface_keyword="interface")

	for member in ["IncomingBarringInEffect",
			"OutgoingBarringInEffect",
			"NearMaximumWarning"]:
		bus.add_signal_receiver(event,
					bus_name="org.ofono",
					signal_name = member,
					member_keyword="member",
					path_keyword="path",
					interface_keyword="interface")

	for member in ["ModemAdded",
			"ContextAdded",
			"CallAdded",
			"MessageAdded"]:
		bus.add_signal_receiver(added,
					bus_name="org.ofono",
					signal_name = member,
					member_keyword="member",
					path_keyword="path",
					interface_keyword="interface")

	for member in ["ModemRemoved",
			"ContextRemoved",
			"CallRemoved",
			"MessageRemoved"]:
		bus.add_signal_receiver(removed,
					bus_name="org.ofono",
					signal_name = member,
					member_keyword="member",
					path_keyword="path",
					interface_keyword="interface")

	for member in ["DisconnectReason", "Forwarded", "BarringActive"]:
		bus.add_signal_receiver(value,
					bus_name="org.ofono",
					signal_name = member,
					member_keyword="member",
					path_keyword="path",
					interface_keyword="interface")

	for member in ["IncomingBroadcast", "EmergencyBroadcast",
			"IncomingMessage", "ImmediateMessage", "StatusReport"]:
		bus.add_signal_receiver(message,
					bus_name="org.ofono",
					signal_name = member,
					member_keyword="member",
					path_keyword="path",
					interface_keyword="interface")

	for member in ["NotificationReceived", "RequestReceived"]:
		bus.add_signal_receiver(ussd,
					bus_name="org.ofono",
					signal_name = member,
					member_keyword="member",
					path_keyword="path",
					interface_keyword="interface")

	for member in ["NetworkTimeChanged"]:
		bus.add_signal_receiver(network_time_changed,
					bus_name="org.ofono",
					signal_name = member,
					member_keyword="member",
					path_keyword="path",
					interface_keyword="interface")

	mainloop = GLib.MainLoop()
	mainloop.run() 
 *
 */

import Process = require("./Process");
import child_process = require("child_process");
import events = require("events");
import fs = require("fs");
import path = require("path");
var dbus = require("dbus-native");


export class Ofonod extends Process {

    public static Instance: Ofonod;

	private _dev_cache = {};

	private _sub_cache = {};

	private _emitter_cache = []

	private bus;


	HangupAll = (path, cb) => {
		if(!(this._sub_cache[path] && this._sub_cache[path].VoiceCallManager)){
			return cb(new Error("Service or Device not Found on " + path));
		}
		this._sub_cache[path].VoiceCallManager.HangupAll(cb);
	};

	AnwserCall = (path, cb) => {
		this.bus.getInterface("org.ofono", path, "org.ofono.VoiceCall", (err, conn) => {
			if(err) return cb(err);
			conn.Anwser(cb);
		});
	};
	
	Dial = (path, num, hidecallerid, cb) => {
		if(!(this._sub_cache[path] && this._sub_cache[path].VoiceCallManager)){
			return cb(new Error("Service or Device not Found on " + path));
		}
		hidecallerid = hidecallerid ? hidecallerid : "default";
		this._sub_cache[path].VoiceCallManager.Dial(num, hidecallerid, cb);
	}

    constructor() {
        super("Ofonod");
        Ofonod.Instance = this;
    }
    
	_change = (path) => {
		var coolName = path.split("_")[1];
		if(!(coolName && coolName.length > 0)) return;
		coolName = coolName.match(/.{1,2}/g).join(':'); //YEA;
		info(coolName + " - Changed..");
		info(this._dev_cache[path]);
		coolName = coolName.toLowerCase();
		this.emit('change', coolName, this._dev_cache[path], path);
	};
	
	_setup_callManager = (path, conn) => {
		if(!this._dev_cache[path]) return;
		conn.on("CallAdded", (id, call) => {
			call = dbus_magic(call);
			if(!this._dev_cache[path]) return;
			if(!this._dev_cache[path].Calls) this._dev_cache[path].Calls = {};
			this._dev_cache[path].Calls[id] = call;
		    this.bus.getInterface("org.ofono", id, "org.ofono.VoiceCall", (err, conn) => {
				trace("Call : " + id);
				trace(conn);
				if(!this._sub_cache[path]) return;
				this._sub_cache[path][id] = conn;
				conn.on("PropertyChanged", (key, val) => {
					if(!this._dev_cache[path].Calls[id]) return;
					val = dbus_magic(val);
					this._dev_cache[path].Calls[id][key] = val;
					this._change(path);
				});
				conn.on("DisconnectReason", (reason)=>{
					if(!this._dev_cache[path].Calls[id]) return;
					this._dev_cache[path].Calls[id].DisconnectReason = reason;
				});
			});
			this._change(path);
		});
		conn.on("CallRemoved", (id) => {
			if(!this._dev_cache[path] || !this._dev_cache[path].Calls) return;
			this._dev_cache[path].Calls[id].Removed = true;
			if(this._sub_cache[path][id]) { delete this._sub_cache[path][id]; }
			this._change(path);
		});
	};
	
	_check_and_hook = (path) => {
		if(!(this._dev_cache[path] 
			&& this._sub_cache[path] 
			&& this._dev_cache[path].Interfaces
			&& this._dev_cache[path].Interfaces.length > 0)){
			return; //nevermind
		}
		var ifaces = this._dev_cache[path].Interfaces;
		for(var t in this._sub_cache[path]){
			if(!ifaces.indexOf(t) && this._sub_cache[path][t]){
				this._sub_cache[path][t].removeAllListeners();
			}
		}
		
		for(var q = 0; q < ifaces.length; q++){
			if(this._sub_cache[path][ifaces[q]]) continue; //skip
			((_iface)=>{
		        this.bus.getInterface("org.ofono", path, _iface, (err, conn) => {
					if(err || !this._sub_cache[path]) return;
					var leName = _iface.replace("org.ofono.", ""); //"VoiceCallManager"
					this._sub_cache[path][leName] = conn;
					conn.GetProperties((err, result)=>{
						if(err || !this._dev_cache[path]) return;
						result = dbus_magic(result); 
						this._dev_cache[path][leName] = result;
						this._change(path);
					});
					conn.on("PropertyChanged", (key, val)=>{
						val = dbus_magic(val);
						if(!this._dev_cache[path]) return;
						if(!this._dev_cache[path][leName]) {
							this._dev_cache[path][leName] = {};
						}
						this._dev_cache[path][leName][key] = val;
						this._change(path);
					});
					
					if(leName === "VoiceCallManager") {
						this._setup_callManager(path, conn);
					}
				});
			})(ifaces[q]);
		}
	};
	
	_hook = (path, val?) => {
		if(!this._dev_cache[path]){
			//WOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
	        this.bus.getInterface("org.ofono", path, "org.ofono.Modem", (err, conn) => {
				this._emitter_cache.push(conn);
				this._sub_cache[path] = {};
				conn.GetProperties((err, result)=>{
					if(err) return;
					result = dbus_magic(result); 
					this._dev_cache[path] = result;
					this._check_and_hook(path);
					this._change(path);
				});
				conn.on("PropertyChanged", (key, val)=>{
					val = dbus_magic(val);
					if(!this._dev_cache[path]) return;
					this._dev_cache[path][key] = val;
					this._check_and_hook(path);
					this._change(path);
				});
			});
		} else if(val) {
			this._dev_cache[path] = val;
			this._check_and_hook(path);
			this._change(path);
		}
	};
	
    _start_dbus = (cb = (err?) => { }) => {

        if (this.bus) return cb();
        this.bus = dbus.systemBus({ socket: "/var/run/dbus/system_bus_socket" });
        
        this.bus.getInterface("org.ofono", "/", "org.ofono.Manager", (err, conn) => {
            if (err) { return cb(err); }
            conn.GetModems((err, modems) => {
                if (err) { return cb(err); } 
                this._dev_cache = {};
				modems = dbus_magic(modems);
				for(var i in modems){
					this._hook(i, modems[i]);
				}
            });
			conn.on("ModemAdded", (d, val) => {
				d = dbus_magic(d);
				val = dbus_magic(val);
				this._hook(d, val);
			});
        });
    };

    _stop_dbus = () => {
        if (this.bus && this.bus.connection) {
            this.bus.connection.end();
            this.bus.connection.removeAllListeners();
            this.bus = undefined;
			while(this._emitter_cache.length){
				this._emitter_cache.pop().removeAllListeners();
			}
			for(var path in this._sub_cache){
				for(var t in this._sub_cache[path]){
					this._sub_cache[path][t].removeAllListeners();
				}
			}
			this._emitter_cache = [];
			this._dev_cache = {};
			this._sub_cache = {};

            this.emit("dbus_Stopped");
        }
    };

    Start(forever: boolean = true) {
        this._stop_dbus();
        killall("ofonod",() => {
            this.Process = child_process.spawn("ofonod", ['-n']);
            setTimeout(() => {
               this._start_dbus(() => {
                   info("OK");
                   super.Start(forever);
               });
            }, 2000);
        });
    }

    Apply = (forever: boolean = true) => { //as helper method
        this.Start(forever);
    };

    OnChoke() {
        super.OnChoke();
        info("Killing all Ofonod processes");
        warn("This should not happen though ! ");
        this.Process.removeAllListeners();
        this.Process = undefined;
        this._stop_dbus();
        killall("ofonod",() => {
            info("Done, waiting for recall");
            this.Choke_Timer = setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 2000);
        });
        return true;
    }

}

