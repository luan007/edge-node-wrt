//We need to patch https://github.com/sidorares/node-dbus/blob/master/lib/bus.js
//line 123

/*
var dbus = require('dbus-native');
var sessionBus = dbus.systemBus();
//sessionBus.connection.on('message', console.log);
var exampleIface = {
    name: 'org.bluez.Agent',
    methods: {
        Release: ['', ''],
        Authorize: ['os', 'd'],
        RequestPinCode: ['o', 's'],
        RequestPasskey: ['o', 'u'],
        DisplayPasskey: ['ou', ''],
        RequestConfirmation: ['ou', ''],
        ConfirmModeChange: ['s', ''],
        Cancel: ['', '']
    },
    signals: { },
    properties: { }
};
var example = {
    Release: console.log,
    Authorize:  function(path, arg) {
      if(arg === "0000111e-0000-1000-8000-00805f9b34fb") {
		//Should return new Error!
      }
    },
    RequestPinCode: console.log,
    RequestPasskey:  console.log,
    DisplayPasskey:  console.log,
    RequestConfirmation:  console.log,
    ConfirmModeChange:  console.log,
    Cancel:  console.log
};

path = "/test/agent";
sessionBus.exportInterface(example, path, exampleIface);
sessionBus.getService('org.bluez').getInterface(
    '/',
    'org.bluez.Manager', function(err, dev) {
	dev.DefaultAdapter(function(err, d){
		sessionBus.getService('org.bluez').getInterface(d, "org.bluez.Adapter", function(err, a){
			a.RegisterAgent(path, "", console.log);
		});
	});
});
*/





















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

    public static Instance: Bluez;

    private IAgent = {
        name: 'org.bluez.Agent',
        methods: {
            Release: ['', ''],
            Authorize: ['os', 'd'],
            RequestPinCode: ['o', 's'],
            RequestPasskey: ['o', 'u'],
            DisplayPasskey: ['ou', ''],
            RequestConfirmation: ['ou', ''],
            ConfirmModeChange: ['s', ''],
            Cancel: ['', '']
        },
        signals: {},
        properties: {}
    };

    private GenericPairingAgent = {
        Release: console.log,
        Authorize: console.log,
        RequestPinCode: console.log,
        RequestPasskey: console.log,
        DisplayPasskey: console.log,
        RequestConfirmation: console.log,
        ConfirmModeChange: console.log,
        Cancel: console.log
    };

    private AudioPairingAgent = {
        Release: console.log,
        Authorize: console.log,
        RequestPinCode: console.log,
        RequestPasskey: console.log,
        DisplayPasskey: console.log,
        RequestConfirmation: console.log,
        ConfirmModeChange: console.log,
        Cancel: console.log
    };


    public GenericIface = CONF.DEV.BLUETOOTH.DEV_HCI;
    public AudioIface = CONF.DEV.BLUETOOTH.DEV_AUD;

    private agentPath = "/edge/" + UUIDstr();
    private audioPath = "/edge/" + UUIDstr();

    private bus;

    public GenericName = "Edge";
    public AudioName = "Edge-Audio";
    public GenericScan = "piscan";
    public AudioScan = "piscan";
    public GenericPower = true;
    public AudioPower = true;

    private _scan_timer = undefined;

    constructor() {
        super("Bluez");
        Bluez.Instance = this;
    }

    private _dev_cache = {}; //obj_path
    
    Get = (addr) => {
        if (!addr) return undefined;
        return this._dev_cache[addr.toLowerCase()];
    };

    _update_property = (addr, dev) => {
        //trace("Update Property - " + addr);
        dev.GetProperties((err, props) => {
            if (err) return;
            props = dbus_magic(props);
            if (!dev.Properties) dev.Properties = props;
            else {
                delta_add(dev.Properties, props, true);
            }
            this._dev_cache[addr].Properties.Alive = true;
            this._dev_cache[addr].Properties.PropertyStamp = Date.now();
            this.emit("Changed", addr);
        });
    };

    _dev_created = (obj_path, cb = () => { }) => {
        var addr = obj_path.substring(obj_path.length - 17).replace(/_/g, ":").toLowerCase();
        if (!this._dev_cache[addr]) {
            this.bus.getInterface("org.bluez", obj_path, "org.bluez.Device",(err, dev) => {
                if (err) return cb();
                this._dev_cache[addr] = dev;

                this._update_property(addr, dev);
                //get hooked 
                this.emit("Created", addr);
                dev.on("PropertyChanged",(id, data) => {
                    data = dbus_magic(data);
                    if (this._dev_cache[addr].Properties) {
                        //trace("Property Changed!! - " + id + ":" + data);
                        this._dev_cache[addr].Properties.PropertyStamp = Date.now();
                        this._dev_cache[addr].Properties[id] = data;
                        this.emit("Changed", addr);
                    } else {
                        this._update_property(addr, dev);
                    }
                });
                return cb();
            });
        }
    };

    _dev_found = (adapter, addr, props) => {
        addr = addr.toLowerCase();
        props = dbus_magic(props);
        trace("Found - " + JSON.stringify(props));
        console.log(this._dev_cache);
        if (!this._dev_cache[addr]) {
            adapter.CreateDevice(addr,(err) => {
                if (!this._dev_cache[addr]) return;
                if (!this._dev_cache[addr].Properties) {
                    this._dev_cache[addr].Properties = props;
                    this._dev_cache[addr].Properties.RSSIStamp = Date.now();
                } else {
                    this._dev_cache[addr].Properties.RSSIStamp = Date.now();
                    this._dev_cache[addr].Properties.RSSI = props.RSSI;
                }
                this.emit("Found", addr);
            });
        } else {
            this._dev_cache[addr].Properties = props;
            this._dev_cache[addr].Properties.Alive = true;
            this._dev_cache[addr].Properties.RSSIStamp = Date.now();
            this.emit("Found", addr);
        }
    };

    _dev_disap = (obj_path) => {
        var addr = obj_path.substring(obj_path.length - 17).replace(/_/g, ":").toLowerCase();
        //trace("Disappear - " + addr);
        if (this._dev_cache[addr]) {
            this._dev_cache[addr].Properties.Alive = false;
            this.emit("Lost", addr);
        }
    };

    _release_dev = (obj_path) => {
        var addr = obj_path.substring(obj_path.length - 17).replace(/_/g, ":").toLowerCase();
        //fatal("Release - " + addr);
        if (this._dev_cache[addr]) {
            this.emit("Removed", addr, this._dev_cache[addr]);
            //this._dev_cache[addr] = undefined;
        }
    };

    _start_dbus = (cb = (err?) => { }) => {

        if (this.bus) return cb();
        this.bus = dbus.systemBus({ socket: "/var/run/dbus/system_bus_socket" });

        this.bus.exportInterface(this.GenericPairingAgent, this.agentPath, this.IAgent);
        this.bus.exportInterface(this.AudioPairingAgent, this.audioPath, this.IAgent);
        
        this.bus.getInterface("org.bluez", "/", "org.bluez.Manager", (err, conn) => {
            if (err) { return cb(err); }
            conn.FindAdapter(this.GenericIface,(err, final) => {
                if (err) { return cb(err); } 
                this._dev_cache = {};
                this.bus.getInterface("org.bluez", final, "org.bluez.Adapter",(err, adapter) => {
                    if (err) return cb(err);

                    adapter.RegisterAgent(this.agentPath, "DisplayYesNo");
                    conn.FindAdapter(this.AudioIface,(err, final) => {
                        if(CONF.IS_DEBUG && err) return;
                        this.bus.getInterface("org.bluez", final, "org.bluez.Adapter",(err, adapter) => {
                            adapter.RegisterAgent(this.audioPath, "DisplayYesNo");
                        });
                    });

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
                            var curState = 1;
                            //adapter.on("PropertyChanged",(name, value) => {
                            //    var value = dbus_magic(value);
                            //    if (name === "Discovering" && !value) {
                            //        if (curState) {
                            //            trace("Stop Discovery");
                            //            adapter.StopDiscovery(console.log);
                            //            curState = 0; //pending 
                            //        }
                            //        else if (curState == 0) {
                            //            curState = -1;
                            //            trace("Should be stopped?");
                            //            adapter.StopDiscovery(console.log);
                            //            this._scan_timer = setTimeout(() => {
                            //                adapter.StartDiscovery();
                            //                info("Start Discovery");
                            //            }, CONF.BLUETOOTH_SCAN_INTERVAL)
                            //        }
                            //    } else if (name === "Discovering" && value) {
                            //        info("Discovery Started...");
                            //    }
                            //});
                            adapter.StartDiscovery();
                            info("Start Discovery");
                            this.emit("dbus_Started");
                            return cb();
                        });
                    });
                });
            });
        });
    };

    _stop_dbus = () => {
        if (this.bus && this.bus.connection) {
            clearTimeout(this._scan_timer);
            this.bus.connection.end();
            this.bus.connection.removeAllListeners();
            this.bus = undefined;
            for (var i in this._dev_cache) {
                this._dev_cache[i] = undefined;
            }
            this.emit("dbus_Stopped");
        }
    };

    Start(forever: boolean = true) {

        var jobs = [
            (cb) => { exec("hciconfig  " + this.GenericIface + " " + (this.GenericPower ? "up" : "down"), ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.GenericIface + " name " + this.GenericName, ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.GenericIface + " " + this.GenericScan, ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.GenericIface + " inqparms 10:2048", ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.GenericIface + " pageparms 20:1024", ignore_err(cb)); },
            (cb) => { exec("sdptool -i " + this.GenericIface + " add --channel=9 OPUSH", ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.GenericIface + " class 0x950300", ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.GenericIface + " noleadv", ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.AudioIface + " " + (this.AudioPower ? "up" : "down"), ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.AudioIface + " name " + this.AudioName, ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.AudioIface + " " + this.AudioScan, ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.AudioIface + " class 200414", ignore_err(cb)); },
            (cb) => { exec("hciconfig  " + this.AudioIface + " noleadv", ignore_err(cb)); },
        ];


        if (this.Process) {
            //Process still running 
            async.series(jobs,() => {
                info("UPDATE");
            });
        }
        else {
            this._stop_dbus();

            killall("bluetoothd",() => {
                this.Process = child_process.spawn("bluetoothd", ['-n']);
                setTimeout(() => {
                    async.series(jobs,() => {
                        this._start_dbus(() => {
                            info("OK");
                            super.Start(forever);
                        });
                    });
                }, 3000);
            });
        }
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

