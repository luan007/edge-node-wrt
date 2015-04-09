var _ip = require("ip");
var _ipaddr = require("ipaddr.js");
global.ip = {};
Object.keys(_ip).forEach(function (val, i, arr) {
    global.ip[val] = _ip[val];
});
Object.keys(_ipaddr).forEach(function (val, i, arr) {
    global.ip[val] = _ipaddr[val];
});
global.ip.kind = function (ip) {
    return _ipaddr.isValid(ip) ? _ipaddr.parse(ip).kind() : undefined;
};
global.ip.range = function (ip) {
    return _ipaddr.isValid(ip) ? _ipaddr.parse(ip).range() : undefined;
};
global.ip.match = function (ip1, ip2, bits) {
    return _ipaddr.isValid(ip1) && _ipaddr.isValid(ip2) ? _ipaddr.parse(ip1).match(_ipaddr.parse(ip2), bits) : undefined;
};
global.ip.cidr_num = function (ip, num) {
    return _ipaddr.isValid(ip) ? _ip.cidr(ip + "/" + num) : undefined;
};
global.ip.cidr_num_Subnet = function (ip, num) {
    return _ipaddr.isValid(ip) ? _ip["cidrSubnet"](ip + "/" + num) : undefined;
};
