require("../../SYS/Env");
require("../CI/SectionConst");

var fs = require("fs");
var hostapd = require("../Libs/Hostapd");
var dnsmasq = require("../Libs/Dnsmasq");

fs.watchFile(hostapd.Config2G, hostapd.FileChanged(hostapd.Config2G));
fs.watchFile(hostapd.Config5G, hostapd.FileChanged(hostapd.Config5G));

fs.watchFile(dnsmasq.Config, dnsmasq.FileChanged);