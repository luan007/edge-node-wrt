//TODO: Bluetooth Support
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
var Process = require("./Process");
var child_process = require("child_process");
var Bluez = (function (_super) {
    __extends(Bluez, _super);
    function Bluez() {
        var _this = this;
        _super.call(this, "Bluez");
        this.Apply = function (forever) {
            if (forever === void 0) { forever = true; }
            _this.Start(forever);
        };
    }
    Bluez.prototype.Start = function (forever) {
        var _this = this;
        if (forever === void 0) { forever = true; }
        killall("bluetoothd", function () {
            _this.Process = child_process.spawn("bluetoothd", ['-n'], {
                stdio: ['ignore', 'ignore', 'ignore']
            });
            info("OK");
            _super.prototype.Start.call(_this, forever);
        });
    };
    Bluez.prototype.OnChoke = function () {
        var _this = this;
        _super.prototype.OnChoke.call(this);
        info("Killing all Bluetoothd processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall("bluetoothd", function () {
            info("Done, waiting for recall");
            _this.Choke_Timer = setTimeout(function () {
                _this.ClearChoke();
                _this.Start();
            }, 2000);
        });
        return true;
    };
    return Bluez;
})(Process);
exports.Bluez = Bluez;
