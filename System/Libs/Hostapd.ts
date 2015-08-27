var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var async = require("async");
var utils = require("./Utils");
var Section = require("../CI/Section");

var cmd = "hostapd";
export var Config2G = "/ramdisk/System/Configs/hostapd_2g.conf";
export var Config5G = "/ramdisk/System/Configs/hostapd_5g.conf";

function run(conf, cb){
    var ps = child_process.spawn(cmd, [conf]);
    ps.stdout.on('hostapd data:', function (data) {
        console.log(data.toString().cyan);
    });
    ps.stderr.on('hostapd stderr:', function (data) {
        console.log('ps stderr: ' + data.toString().red);
    });
    cb();
}
function kill(pid, cb) {
    child_process.exec("kill -9 " + pid, function(error, stdout, stderr) {
        console.log("killed ".red, pid, error, stdout, stderr);
        cb();
    });
}

export function FileChanged(conf) {
    return function(curr, prev) {
        if (curr.mtime !== prev.mtime) {
            console.log(conf, 'has been changed. curr mtime is: ',
                curr.mtime, 'prev mtime was: ' + prev.mtime);

            start(conf)();
        }
    };
}

function start(conf) {
    return function() {
        utils.QueryProcess(cmd + " " + conf, function (err, res) {
            var jobs = [];
            if (res && res.length)
                jobs.push(function (cb) {
                    kill(res[0].pid, cb);
                });
            jobs.push(function (cb) {
                run(conf, cb);
            });
            async.series(jobs, function () {
            });
        });
    };
}

function isAlive(conf) {
    return function(cb) {
        utils.QueryProcess(cmd + " " + conf, function (err, res) {
           return cb(undefined, !!(res && res.length));
        });
    };
}

export function GenerateConfig2G(cb) {
    var handler = Section.GetSection(SECTION_CONST.NETWORK_WIRELESS_2G);
    handler.Write("interface", "ap1");
    handler.Write("bridge", "br0");
    //handler.Write("logger_syslog", -1);
    //handler.Write("logger_syslog_level", 2);
    //handler.Write("logger_stdout", -1);
    //handler.Write("logger_stdout_level", 2);
    //handler.Write("wmm_enabled", 1);
    //handler.Write("uapsd_advertisement_enabled", 1);
    handler.Write("hw_mode", "g");
    handler.Write("ieee80211n", 1);
    //handler.Write("ht_capab", "[HT40+][LPDC][DSSS_CCK-40][TX-STBC][RX-STBC1][SHORT-GI-20][SHORT-GI-40]");
    handler.Write("ssid", "Edge Exp");
    //handler.Write("utf8_ssid", 1);
    handler.Write("ignore_broadcast_ssid", 0);
    //handler.Write("auth_algs", 1);
    handler.Write("channel", 4);
    //handler.Write("max_num_sta", 255);
    //handler.Write("macaddr_acl", 0);
    handler.Write("ctrl_interface", "/tmp/fdsock/hostapd_aps/");
    handler.Write("ctrl_interface_group", 0);
    //handler.Write("accept_mac_file", "/ramdisk/System/Configs/Miscs/hostapd_accept_mac_file.conf");
    //handler.Write("deny_mac_file", "/ramdisk/System/Configs/Miscs/hostapd_deny_mac_file.conf");
    //handler.Write("obss_interval", 1);
    //handler.Write("wps_state", 0);
    //handler.Write("ap_setup_locked", 0);
    //handler.Write("config_methods", "virtual_push_button physical_push_button");
    //handler.Write("pbc_in_m1", 1);
    //handler.Write("upnp_iface", "br0");
    //handler.Write("device_name", "Edge Exp");
    //handler.Write("manufacturer", "EmergeLabs");
    //handler.Write("model_name", "Edge Exp");
    //handler.Write("model_number", "Late 2015");
    //handler.Write("serial_number", "000000000");
    //handler.Write("model_url", "http://wifi.network/");
    //handler.Write("device_type", "6-0050F204-1");
    //handler.Write("friendly_name", "Edge");
    //handler.Write("manufacturer_url", "http://www.edgerouter.com/");
    //handler.Write("model_description", "Development Version - EmergeLabs");
    //handler.Write("uuid", uuid.v4());
    //handler.Write("friendly_name", "Edge");

    handler.Flush(cb);
}

export function GenerateConfig5G(cb) {
    var handler = Section.GetSection(SECTION_CONST.NETWORK_WIRELESS_5G);
    handler.Write("interface", "ap0");
    handler.Write("bridge", "br0");
    //handler.Write("logger_syslog", -1);
    //handler.Write("logger_syslog_level", 2);
    //handler.Write("logger_stdout", -1);
    //handler.Write("logger_stdout_level", 2);
    //handler.Write("wmm_enabled", 1);
    //handler.Write("uapsd_advertisement_enabled", 1);
    handler.Write("hw_mode", "g");
    handler.Write("ieee80211n", 1);
    //handler.Write("ht_capab", "[HT40+][LPDC][DSSS_CCK-40][TX-STBC][RX-STBC1][SHORT-GI-20][SHORT-GI-40]");
    handler.Write("ssid", "Edge Exp 5G");
    //handler.Write("utf8_ssid", 1);
    handler.Write("ignore_broadcast_ssid", 0);
    //handler.Write("auth_algs", 1);
    handler.Write("channel", 4);
    //handler.Write("max_num_sta", 255);
    //handler.Write("macaddr_acl", 0);
    handler.Write("ctrl_interface", "/tmp/fdsock/hostapd_aps/");
    handler.Write("ctrl_interface_group", 0);
    //handler.Write("accept_mac_file", "/ramdisk/System/Configs/Miscs/hostapd_accept_mac_file.conf");
    //handler.Write("deny_mac_file", "/ramdisk/System/Configs/Miscs/hostapd_deny_mac_file.conf");
    //handler.Write("obss_interval", 1);
    //handler.Write("wps_state", 0);
    //handler.Write("ap_setup_locked", 0);
    //handler.Write("config_methods", "virtual_push_button physical_push_button");
    //handler.Write("pbc_in_m1", 1);
    //handler.Write("upnp_iface", "br0");
    //handler.Write("device_name", "Edge Exp");
    //handler.Write("manufacturer", "EmergeLabs");
    //handler.Write("model_name", "Edge Exp");
    //handler.Write("model_number", "Late 2015");
    //handler.Write("serial_number", "000000000");
    //handler.Write("model_url", "http://wifi.network/");
    //handler.Write("device_type", "6-0050F204-1");
    //handler.Write("friendly_name", "Edge");
    //handler.Write("manufacturer_url", "http://www.edgerouter.com/");
    //handler.Write("model_description", "Development Version - EmergeLabs");
    //handler.Write("uuid", uuid.v4());
    //handler.Write("friendly_name", "Edge");

    handler.Flush(cb);
}

function _is_MAC(str) {
    return /[0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5}/gmi.test(str);
}
function _parse(sta, cb) {
    var line = "\n";
    var arr = sta.trim(line).split(line);
    var cur = undefined;
    var stage = {};
    for (var i in arr) {
        var row = arr[i];
        if (_is_MAC(row)) {
            if (!stations[row]) {
                console.log("NEW: ", row);
            }
            cur = {};
            stage[row] = cur;
        } else if (row.trim() !== "") {
            var parts = row.split("=");
            cur[parts[0]] = parts[1];
        }
    }
    for (var k in stations) {
        if (!stage[k]) {
            console.log("DEL: ", k);
        }
    }
    stations = stage;
    return cb(undefined, stations);
}

var stations = {};
function fetch(int) {
    return function(cb) {
        var ps = child_process.execFile("hostapd_cli", ["-p", SECTION_CONST.HOSTAPD_SOCK_FOLDER, "-i", int, "all_sta"], function (err, sta) {
            ps.kill("SIGTERM");
            if (err) return cb(err);
            _parse(sta, cb);
        });
    };
}

export var Start2G = start(Config2G);
export var Start5G = start(Config5G);
export var IsAlive2G = isAlive(Config2G);
export var IsAlive5G = isAlive(Config5G);
export var Fetch2G = fetch(SECTION_CONST.DEV.WLAN.DEV_2G);
export var Fetch5G = fetch(SECTION_CONST.DEV.WLAN.DEV_5G);


