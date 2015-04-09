var Core = require("Core");
var iptables = require("../Native/iptables");
var mac_table = {};
var handler = {};
function GetForwardRate() {
    if (iptables.Iptables.Filter.FORWARD.Delta_Time != 0) {
        return {
            Bytes: iptables.Iptables.Filter.FORWARD.Delta_Bytes / (iptables.Iptables.Filter.FORWARD.Delta_Time / 1000000),
            Packets: iptables.Iptables.Filter.FORWARD.Delta_Packets / (iptables.Iptables.Filter.FORWARD.Delta_Time / 1000000)
        };
    }
    else {
        return {
            Bytes: 0,
            Packets: 0
        };
    }
}
exports.GetForwardRate = GetForwardRate;
function NotifyOnTraffic(mac, up, down) {
    mac = mac.toLowerCase();
    handler[mac] = [up, down];
}
exports.NotifyOnTraffic = NotifyOnTraffic;
function RemoveHandler(mac) {
    mac = mac.toLowerCase();
    delete handler[mac];
}
exports.RemoveHandler = RemoveHandler;
function Initialize(cb) {
    cb();
}
exports.Initialize = Initialize;
function onTraffic(g, bytes, oldB, pkgs, oldP, deltaTime) {
    var i_o = g["__DIR"];
    var mac = g["__MAC"];
    mac = mac.toLowerCase();
    if (handler[mac]) {
        handler[mac][i_o](mac, {
            Bytes: bytes,
            Packets: pkgs,
            PrevBytes: oldB,
            PrevPackets: oldP,
            Rate: {
                DeltaTime: deltaTime,
                Bps: deltaTime > 0 ? ((bytes - oldB) / (deltaTime / 1000000)) : 0,
                Pps: deltaTime > 0 ? ((pkgs - oldP) / (deltaTime / 1000000)) : 0
            }
        });
    }
}
function Watch(mac, _ip, cb) {
    if (!_ip) {
        return cb(new Error("IP is undefined"));
    }
    trace("Watch " + mac + " - " + _ip);
    try {
        if (ip.parse(_ip).kind() != "ipv4")
            return cb();
    }
    catch (e) {
        return cb();
    }
    mac = (mac + "").toLowerCase();
    if (mac_table[mac]) {
        return Update(mac, _ip, cb);
    }
    mac_table[mac] = [
        new iptables.Rule(),
        new iptables.Rule()
    ];
    mac_table[mac][0].Source = mac_table[mac][1].Destination = {
        Addr: _ip
    };
    mac_table[mac][0]["__DIR"] = 0;
    mac_table[mac][1]["__DIR"] = 1;
    mac_table[mac][0]["__MAC"] = mac_table[mac][1]["__MAC"] = mac;
    mac_table[mac][0].Target = mac_table[mac][1].Target = 1000 /* RETURN */;
    mac_table[mac][1].Chain = Core.Router.Network.Chains.System.Mangle.TrafficPost;
    mac_table[mac][0].Chain = Core.Router.Network.Chains.System.Mangle.TrafficPre;
    mac_table[mac][0].on("traffic", onTraffic);
    mac_table[mac][1].on("traffic", onTraffic);
    async.parallel([
        mac_table[mac][0].Save,
        mac_table[mac][1].Save
    ], cb);
}
exports.Watch = Watch;
function Unwatch(mac, cb) {
    trace("Unwatch " + mac);
    if (!mac_table[mac]) {
        return cb(new Error("Mac does not exist"));
    }
    var cache = mac_table[mac];
    delete mac_table[mac];
    async.series([
        function (c) {
            cache[0].Remove(function () {
                c();
            });
        },
        function (c) {
            cache[1].Remove(function () {
                c();
            });
        }
    ], function (err) {
        if (err) {
            error("Something is wrong with Traffic Accountant");
            error(err);
        }
        else {
        }
        cb(err);
    });
}
exports.Unwatch = Unwatch;
function Update(mac, _ip, cb) {
    if (!_ip) {
        return cb(new Error("IP is undefined"));
    }
    trace("Update " + mac + " - " + _ip);
    try {
        if (ip.parse(_ip).kind() != "ipv4")
            return cb();
    }
    catch (e) {
        return cb();
    }
    mac = (mac + "").toLowerCase();
    if (!mac_table[mac]) {
        return Watch(mac, _ip, cb);
    }
    mac_table[mac][0].Source = mac_table[mac][1].Destination = {
        Addr: _ip
    };
    async.parallel([
        mac_table[mac][0].Save,
        mac_table[mac][1].Save
    ], cb);
}
exports.Update = Update;
