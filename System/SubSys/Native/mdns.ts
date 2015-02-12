/*
var mdns = require('mdns');
 
// advertise a http server on port 4321 
var ad = mdns.createAdvertisement(mdns.tcp('device-info'), 0, { txtRecord : {
	model:"AirPort"
} });
ad.start();

var ad2 = mdns.createAdvertisement(mdns.tcp('smb'), 445);
ad2.start();
*/

//TODO: Add MDNS Support (for samba & finder)