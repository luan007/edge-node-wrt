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

