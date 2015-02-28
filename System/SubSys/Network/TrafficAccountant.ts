import Core = require("Core");
import Node = require("Node");
import network = Core.Router.Network;
import ipCore = Core.SubSys.Native.ip;
import iptables = Core.SubSys.Native.iptables;
/*http://code.google.com/p/wrtbwmon/*/

//[in, out]
var mac_table: IDic<iptables.Rule[]> = {};
var handler = {};


export function GetForwardRate() {
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

export function NotifyOnTraffic(mac, handler) {
    mac = mac.toLowerCase(); //must
    handler[mac] = handler;
}

export function RemoveHandler(mac) {
    mac = mac.toLowerCase(); //must
    delete handler[mac];
}


export function Initialize(cb) {
    ipCore.Neigh.on(ipCore.Neigh.EVENT_RECORD_NEW,(c: ipCore.NeighRecord) => { Watch(c.Mac, c.Address,() => { }); });
    ipCore.Neigh.on(ipCore.Neigh.EVENT_RECORD_DEL,(c: ipCore.NeighRecord) => { Update(c.Mac, c.Address,() => { }); });
    ipCore.Neigh.on(ipCore.Neigh.EVENT_RECORD_CHANGE,(c: ipCore.NeighRecord) => { Unwatch(c.Mac, c.Address,() => { }); });
}

function onTraffic(g: iptables.Rule, bytes, oldB, pkgs, oldP, deltaTime){
    var i_o = g["__DIR"]; //0 -> out, 1 <- in
    var mac = g["__MAC"];
    if (handler[mac]) {
        handler[mac](mac, {
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


export function Watch(mac, _ip, cb) {
    if (ip.parse(_ip).kind() != "ipv4") return;
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
    mac_table[mac][0].Target = mac_table[mac][1].Target = iptables.Target_Type.RETURN;
    mac_table[mac][0].Chain = mac_table[mac][1].Chain = network.Chains.System.Filter.TrafficAccounting;
    mac_table[mac][0].on("traffic", onTraffic);
    mac_table[mac][1].on("traffic", onTraffic);
    async.series([
        mac_table[mac][0].Save,
        mac_table[mac][1].Save
    ], cb);

}

export function Unwatch(mac, _ip, cb) {
    if (ip.parse(_ip).kind() != "ipv4") return;
    mac = (mac + "").toLowerCase();
    if (!mac_table[mac]) {
        return cb(new Error("Mac does not exist"));
    }
    async.series([
        mac_table[mac][0].Remove,
        mac_table[mac][1].Remove],(err) => {
            if (err) {
                //omg something is wrong... 
                error("Something is wrong with Traffic Accountant");
                error(err);
            } else {
            }
            cb(err);
        });
    delete mac_table[mac]; //Success
}

export function Update(mac, _ip, cb) {
    if (ip.parse(_ip).kind() != "ipv4") return;
    //ip changed, but not mac :p
    mac = (mac + "").toLowerCase();
    if (!mac_table[mac]) {
        return Watch(mac, _ip, cb);
    }
    mac_table[mac][0].Source = mac_table[mac][1].Destination = {
        Addr: _ip
    };
    async.series([
        mac_table[mac][0].Save,
        mac_table[mac][1].Save
    ], cb);
}