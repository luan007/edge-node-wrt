/**
 * ECI
 *
 * invocation:
 *
 *      ECI network set key value key2 value2
 *      ECI network get key
 *
 */

var res = {
    success:false,
    result: ""
};
var output = function(obj) { return console.log(JSON.stringify(obj));  }

if (process.argv.length < 4) {
    res.result = "arguments missing";
    return output(res);
}
var entry = process.argv[2];
var command = process.argv[3];
var key = process.argv[4];
var value = process.argv[5];

var mapping = {};
mapping["network"] = ["/ramdisk/System/Configs/dnsmasq.json", "/etc/dnsmasq.conf"];
mapping["wlan2g"] = ["/ramdisk/System/Configs/wlan.json", "/etc/hostapd_2g.conf"];
mapping["wlan5g"] = ["/ramdisk/System/Configs/wlan.json", "/etc/hostapd_5g.conf"];

if(!mapping.hasOwnProperty(entry)){
    res.result = "illegal entry";
    return output(res);
}

var fs = require("fs");
var sections = {};
var conf = mapping[entry];
var delimiter = "=";
var line = "\n";
var rows = fs.readFileSync(conf).split(line);

rows.forEach(function(row){
    var parts = row.split(delimiter);
    var row = parts[0];
    var val = parts[1];
    sections[row] = sections[row] || [];
    sections[row].push(val !== undefined ? row + "=" + val : row);
});

//TODO: translation
if(command === "get") {
    if(sections[key]){
        res.success = true;
        res.result = sections[key].length == 1 ? sections[key][0] : sections[key];
        return output(res);
    }
    res.result = "key not found";
    return output(res);
} else if(command === "set") {

}