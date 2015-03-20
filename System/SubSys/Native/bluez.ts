//TODO: Bluetooth Support

//udevadm monitor --udev!!!
//http://www.raspberrypi.org/forums/viewtopic.php?t=26685 <-- very helpful

//bluetooth-agent (block)
//will pair



//http://delx.net.au/blog/2014/01/bluetooth-audio-a2dp-receiver-raspberry-pi/

//http://vadimgrinco.com/turning-your-cubieboardraspberrypi-into-an-a2dp-capable-media-player.html

//HCI 2.0
//HCI 4.0


//various stuff here (just randomly put together...)
//


// 2.0 workflow

// 1. scan
//  use hcitool scan / hcitool inq, but it may not always work
//  use hcidump -a / hcidump -R to parse raw packets, always work. 

// 2. get detailed info about one device
//  use sdptool browse <bdaddr>
//  may not need to parse it, cuz you have hcidump
//

// 3. connect to one device & auth 
//  use hcitool cc <bdaddr> && hcitool auth <bdaddr> (same line, please)
//  use hcitool con to check


// 4. send a file?
//  use sdptool browse <bdaddr>
//  find "obexpush" (forgot the real one, must be something else)
//  there should be a channel number (like 15)

// use ussp-push <bdaddr>@<channel> file target_name to start, add --debug to parse progress
// quit when finished

// multiple file-transfer in same time are tested, and works.

// disconnect: hcitool dc (or ds.. i forget) <bdaddr> (my VM is broken at this moment..) 


// misc config
// 1. device name
// hciconfig name "anything" <-- emoji tested, works :p

// 2. device visibility
// hciconfig piscan <-- visible pscan/iscan

// 3. device class
// hciconfig class 0xsomething

// 4. device auth
// hciconfig auth / noauth
// 


import Process = require("./Process");
import child_process = require("child_process");
import events = require("events");
import fs = require("fs");
import path = require("path");
var dbus = require("dbus-native");

export class Bluez extends Process {

    public GenericIface = "hci0";

    private bus;

    constructor() {
        super("Bluez");
    }

    private _dev_cache = {}; //obj_path
    
    _update_property = (addr, dev) => {
        dev.GetProperties((err, props) => {
            if (err) return;
            props = dbus_magic(props);
            if (!dev.Properties) dev.Properties = props;
            else {
                delta_add(dev.Properties, props, true);
            }
            this.emit("PropertyChanged", addr);
        });
    };

    _dev_created = (obj_path, cb = () => { }) => {
        var addr = obj_path.substring(obj_path.length - 17).replace("_", ":").toLowerCase();
        if (!this._dev_cache[addr]) {
            this.bus.getInterface("org.bluez", obj_path, "org.bluez.Device",(err, dev) => {
                if (err) return cb();
                this._dev_cache[addr] = dev;
                this._dev_cache[addr].Alive = true;
                this._update_property(addr, dev);
                //get hooked 
                dev.on("PropertyChanged",(id, data) => {
                    data = dbus_magic(data);
                    this._dev_cache[addr].Properties.PropertyStamp = Date.now();
                    this._update_property(addr, dev);
                });
                return cb();
            });
        }
    };

    _dev_found = (adapter, addr, props) => {
        addr = addr.toLowerCase();
        props = dbus_magic(props);
        if (!this._dev_cache[addr]) {
            adapter.CreateDevice(addr);
        } else {
            this._dev_cache[addr].Properties = props;
            this._dev_cache[addr].Alive = true;
            this._dev_cache[addr].Properties.RSSIStamp = Date.now();
            this.emit("RSSIChanged", addr);
        }
    };

    _dev_disap = (obj_path) => {
        var addr = obj_path.substring(obj_path.length - 17).replace("_", ":").toLowerCase();
        if (this._dev_cache[addr]) {
            this._dev_cache[addr].Alive = false;
        }
    };

    _release_dev = (obj_path) => {
        var addr = obj_path.substring(obj_path.length - 17).replace("_", ":").toLowerCase();
        if (this._dev_cache[addr]) {
            this._dev_cache[addr].removeAllListeners();
            this._dev_cache[addr] = this._dev_cache[addr] = undefined;
        }
    };

    _start_dbus = (cb = (err?) => { }) => {
        if (this.bus) return cb();
        this.bus = dbus.systemBus({ socket: "/var/run/dbus/system_bus_socket" });
        this.bus.getInterface("org.bluez", "/", "org.bluez.Manager",(err, conn) => {
            if (err) { return cb(err); } 
            conn.FindAdaptor(this.GenericIface, (err, final) => {
                if (err) { return cb(err); } 
                this._dev_cache = {};
                this.bus.getInterface("org.bluez", final, "org.bluez.Adapter",(err, adapter) => {
                    if (err) return cb(err);
                    adapter.GetProperties((err, arr) => {
                        if (err) return cb(err);
                        var prop = dbus_magic(arr);
                        var d = prop.Devices;
                        var jobs = [];
                        for (var i = 0; i < d.length; i++) {
                            jobs.push(this._dev_created.bind(null, d[i]));
                        }
                        async.series(jobs,() => {
                            //ready
                            adapter.on("DeviceCreated", this._dev_created);
                            adapter.on("DeviceFound", this._dev_found.bind(null, adapter));
                            adapter.on("DeviceDisappeared", this._dev_disap);
                            adapter.on("DeviceRemoved", this._release_dev);
                            return cb();
                        });
                    });
                });
            });
        });
    };

    _stop_dbus = () => {
        if (this.bus && this.bus.connection) {
            this.bus.connection.end();
            this.bus.connection.removeAllListeners();
            this.bus = undefined;
            for (var i in this._dev_cache) {
                this._dev_cache[i].removeAllListeners();
                this._dev_cache[i] = undefined;
            }
        }
    };

    Start(forever: boolean = true) {
        this._stop_dbus();
        killall("bluetoothd",() => {
            this.Process = child_process.spawn("bluetoothd", ['-n'], {
                stdio: ['ignore', 'ignore', 'ignore']
            });
            async.series([
                exec.bind(null, "hciconfig  " + this.GenericIface + " down"),
                exec.bind(null, "hciconfig  " + this.GenericIface + " up"),
                exec.bind(null, "hciconfig  " + this.GenericIface + " name edge-router"),
                exec.bind(null, "hciconfig  " + this.GenericIface + " down"),
                exec.bind(null, "hciconfig  " + this.GenericIface + " up"),
                exec.bind(null, "hciconfig  " + this.GenericIface + " piscan"),
                exec.bind(null, "hciconfig  " + this.GenericIface + " inqparms 20:4096"),
                exec.bind(null, "hciconfig  " + this.GenericIface + " pageparms 200:1024"),
                exec.bind(null, "sdptool -i " + this.GenericIface + " add --channel=9 OPUSH"),
                exec.bind(null, "hciconfig  " + this.GenericIface + " class 0x950300")
            ],() => {
                    this._start_dbus(() => {
                        info("OK");
                        super.Start(forever);
                    });
                });
        });
    }

    Apply = (forever: boolean = true) => { //as helper method
        this.Start(forever);
    };

    OnChoke() {
        super.OnChoke();
        info("Killing all Bluetoothd processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        this._stop_dbus();
        killall("bluetoothd",() => {
            info("Done, waiting for recall");
            this.Choke_Timer = setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 2000);
        });
        return true;
    }
}

