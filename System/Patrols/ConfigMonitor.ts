require("../CI/SectionConst");

var fs = require("fs");
var path = require("path");
var hostapd = require("../Libs/Network/Hostapd");
var dnsmasq = require("../Libs/Network/Dnsmasq");

//var trackers = {};
//
//function watch(filePath, func) {
//    var stat = fs.statSync(filePath);
//    if(!trackers[filePath]) {
//        trackers[filePath] = stat.mtime;
//    } else if (trackers[filePath] !== stat.mtime){
//        func();
//    }
//}
//
//setInterval(function(){
//    watch(hostapd.Config2G, hostapd.Start2G);
//    watch(hostapd.Config5G, hostapd.Start5G);
//    watch(dnsmasq.Config, dnsmasq.Start);
//}, 2000);

fs.watchFile(hostapd.Config2G, hostapd.FileChanged(hostapd.Config2G));
////fs.watchFile(hostapd.Config5G, hostapd.FileChanged(hostapd.Config5G));
//
fs.watchFile(dnsmasq.Config, dnsmasq.FileChanged);