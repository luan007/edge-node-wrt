import Node = require("Node");
import Core = require("Core");
import Native = Core.SubSys.Native;
import Abstract = Core.Lib.Abstract;

export function Initialize(cb) {
    async.series([
        (c) => {
            exec("iw ap0 del",() => { trace("DEL AP0"); setTimeout(c, 1000); });
        },
        (c) => {
            exec("iw ap1 del",() => { trace("DEL AP0"); setTimeout(c, 1000); });
        },
        (c) => {
            exec("iw phy phy0 interface add ap0 type __ap",() => { trace("AP0"); setTimeout(c, 1000); });
        },
        (c) => {
            exec("iw phy phy1 interface add ap1 type __ap",() => { trace("AP1"); setTimeout(c, 1000); });
        },
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/ip_forward"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv6/conf/default/forwarding"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv6/conf/all/forwarding"),
        exec.bind(null, "echo 8388608 > /proc/sys/net/core/rmem_max"),
        exec.bind(null, "echo 8388608 > /proc/sys/net/core/wmem_max"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/tcp_timestamps"),
        //exec.bind(null, "echo 1 > /proc/sys/net/ipv4/tcp_bic"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/tcp_fack"),
        exec.bind(null, "echo 1 > /proc/sys/net/ipv4/tcp_sack"),
        exec.bind(null, "echo '8192 4194304 8388608' > /proc/sys/net/ipv4/tcp_wmem"),
        exec.bind(null, "echo '4096 2097152 8388608' > /proc/sys/net/ipv4/tcp_rmem"),
    ], cb);
}