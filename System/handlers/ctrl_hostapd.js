var conf_2g = "/ramdisk/System/externals/configs/hostapd_2g.conf";
var conf_5g = "/ramdisk/System/externals/configs/hostapd_5g.conf";
var sock = "/tmp/fdsock/hostapd_aps/";
var stations = {};
var uuid = require("uuid");

(function (ACL_TYPE) {
    ACL_TYPE[ACL_TYPE["ACCEPT_UNLESS_DENY"] = 0] = "ACCEPT_UNLESS_DENY";
    ACL_TYPE[ACL_TYPE["DENY_UNLESS_ACCEPT"] = 1] = "DENY_UNLESS_ACCEPT";
})(exports.ACL_TYPE || (exports.ACL_TYPE = {}));
var ACL_TYPE = exports.ACL_TYPE;
(function (_80211_BASE) {
    _80211_BASE[_80211_BASE["B"] = -1] = "B";
    _80211_BASE[_80211_BASE["G"] = 0] = "G";
    _80211_BASE[_80211_BASE["N"] = 1] = "N";
    _80211_BASE[_80211_BASE["A"] = 2] = "A";
})(exports._80211_BASE || (exports._80211_BASE = {}));
var _80211_BASE = exports._80211_BASE;
(function (RX_SPATIALSTREAM) {
    RX_SPATIALSTREAM[RX_SPATIALSTREAM["NONE"] = 0] = "NONE";
    RX_SPATIALSTREAM[RX_SPATIALSTREAM["SINGLE"] = 1] = "SINGLE";
    RX_SPATIALSTREAM[RX_SPATIALSTREAM["DUAL"] = 2] = "DUAL";
    RX_SPATIALSTREAM[RX_SPATIALSTREAM["TRIPLE"] = 3] = "TRIPLE";
})(exports.RX_SPATIALSTREAM || (exports.RX_SPATIALSTREAM = {}));
var RX_SPATIALSTREAM = exports.RX_SPATIALSTREAM;
(function (TX_SPATIALSTREAM) {
    TX_SPATIALSTREAM[TX_SPATIALSTREAM["NONE"] = 0] = "NONE";
    TX_SPATIALSTREAM[TX_SPATIALSTREAM["SINGLE"] = 1] = "SINGLE";
})(exports.TX_SPATIALSTREAM || (exports.TX_SPATIALSTREAM = {}));
var TX_SPATIALSTREAM = exports.TX_SPATIALSTREAM;

function Config2G(cb) {
    var cfg2g = {
        Power: true,
        SSID: "Edge Exp",
        AutoSSID: false,
        Visible: true,
        Channel: 4,
        Password: undefined,
        Bridge: "br0",
        Aux: { //GuestWifi
            "0": {
                Power: false,
                SSID: undefined,
                Password: undefined,
                Visible: false
            }
        }
    };
    var cfgString = Cfg2String(GetConfig("ap1", cfg2g));
    console.log(cfgString);
    fs.writeFile(conf_2g, cfgString, cb);
}

function Config5G(cb) {
    var cfg5g = {
        Power: false,
        SSID: "Edge Exp 5G",
        AutoSSID: false,
        Visible: true,
        Channel: 36,
        Password: undefined,
        Bridge: "br0",
        Aux: { //GuestWifi
            "0": {
                Power: false,
                SSID: undefined,
                Password: undefined,
                Visible: false
            }
        }
    };
    var cfgString = Cfg2String(GetConfig("ap0", cfg5g));

    fs.writeFile(conf_5g, cfgString, cb);
}

function GetConfig(int, cfg) {
    var Config = (function () {
        function ConfigBase() {
            this.Auto_SSID = true;
            this.Logger = {
                System: -1,
                System_level: 2,
                StdOut: -1,
                StdOut_level: 2
            };
            this.Dev = int;
            this.Base = _80211_BASE.N;
            this.Channel = 1;
            this.MaxStations = 255;
            this.MacAddressControl = ACL_TYPE.ACCEPT_UNLESS_DENY;
            this.BSSID = undefined;
            this.HT_Capatability = {
                HT40: true,
                DSSS_CCK_40: true,
                TX_STBC: TX_SPATIALSTREAM.SINGLE,
                RX_STBC: RX_SPATIALSTREAM.SINGLE
            };
            this.BroadcastSSID = true;
            this.Password = undefined;
            this.BSS = {};
        }

        return ConfigBase;
    })();

    var conf = new Config();
    if (has(cfg, "Bridge")) {
        conf.Bridge = cfg.Bridge;
    }
    if (has(cfg, "SSID")) {
        conf.SSID = cfg.SSID;
    }
    if (has(cfg, "AutoSSID")) {
        if (cfg.AutoSSID) {
            conf.SSID = "Networkname"; //override :p
        } else {
            conf.SSID = cfg.SSID ? cfg.SSID : "SSID"; //override :p
        }
    }
    if (has(cfg, "Visible")) {
        conf.BroadcastSSID = cfg.Visible;
    }
    if (has(cfg, "Password")) {
        conf.Password = cfg.Password;
    }
    if (has(cfg, "Channel")) {
        conf.Channel = cfg.Channel;
    }

    return conf;
    //fs.writeFile(conf, Cfg2String(conf), cb);
}

function Cfg2String(conf) {
    var newconf = "";
    var line = "\n";
    newconf += "interface=" + conf.Dev + line;
    if (conf.Bridge) {
        newconf += "bridge=" + conf.Bridge + line;
    }
    if (conf.Logger) {
        newconf += "logger_syslog=" + conf.Logger.System + line;
        newconf += "logger_syslog_level=" + conf.Logger.System_level + line;
        newconf += "logger_stdout=" + conf.Logger.StdOut + line;
        newconf += "logger_stdout_level=" + conf.Logger.StdOut_level + line;
    }

    switch (conf.Base) {
        case _80211_BASE.A:
            newconf += "wmm_enabled=1" + line;
            newconf += "hw_mode=a" + line;
            newconf += "ieee80211n=1" + line;
            newconf += "ieee80211ac=1" + line;
            newconf += "uapsd_advertisement_enabled=1" + line;
            break;
        case _80211_BASE.B:
            newconf += "hw_mode=b" + line;
            break;
        case _80211_BASE.G:
            newconf += "hw_mode=g" + line;
            break;
        case _80211_BASE.N:
            newconf += "wmm_enabled=1" + line;
            newconf += "uapsd_advertisement_enabled=1" + line;
            newconf += "hw_mode=g" + line;
            newconf += "ieee80211n=1" + line;
            //[MAX-AMSDU-7935]
            newconf += 'ht_capab=[HT40+][LPDC][DSSS_CCK-40][TX-STBC][RX-STBC1][SHORT-GI-20][SHORT-GI-40]'
                + line;

            break;
    }

    newconf += "ssid=" + conf.SSID + line;
    newconf += "utf8_ssid=1" + line;
    newconf += "ignore_broadcast_ssid=" + (conf.BroadcastSSID ? '0' : '1') + line;
    newconf += "auth_algs=1" + line;
    newconf += conf.BSSID ? conf.BSSID : "";
    newconf += "channel=" + conf.Channel + line;
    newconf += "max_num_sta=" + conf.MaxStations + line;

    newconf += "macaddr_acl=" + conf.MacAddressControl + line;

    newconf += "ctrl_interface=/tmp/fdsock/hostapd_aps/" + line;
    newconf += "ctrl_interface_group=0" + line;


    if (conf.Password) {
        newconf += "wpa=3" + line;
        newconf += "wpa_passphrase=" + conf.Password + line;
        newconf += "wpa_key_mgmt=WPA-PSK" + line;
        newconf += "wpa_pairwise=TKIP CCMP" + line;
        newconf += "rsn_pairwise=CCMP" + line; //wpa2
    }
    for (var _dev in conf.BSS) {
        if (!has(conf.BSS, _dev)) continue;
        newconf += "bss=" + _dev + line;
        newconf += "ssid=" + conf.BSS[_dev].SSID + line;
        if (conf.BSS[_dev].Password) {
            newconf += "wpa=3" + line;
            newconf += "wpa_passphrase=" + conf.BSS[_dev].Password + line;
            newconf += "wpa_key_mgmt=WPA-PSK" + line;
            newconf += "wpa_pairwise=TKIP CCMP" + line;
            newconf += "rsn_pairwise=CCMP" + line; //wpa2
        }

    }

    newconf += "accept_mac_file=/ramdisk/System/externals/miscs/hostapd_accept_mac_file.conf" + line;
    newconf += "deny_mac_file=/ramdisk/System/externals/miscs/hostapd_deny_mac_file.conf" + line;
    newconf += "obss_interval=1" + line;

    /* This may cause problem in windows ... network-discovery got crazy */
    newconf += "wps_state=2" + line;
    newconf += "ap_setup_locked=0" + line;
    newconf += "config_methods=virtual_push_button physical_push_button" + line;
    newconf += "pbc_in_m1=1" + line;
    newconf += "upnp_iface=br0" + line;
    newconf += "device_name=Edge Router" + line;
    newconf += "manufacturer=EmergeLabs" + line;
    newconf += "model_name=Edge One" + line;
    newconf += "model_number=Late 2015" + line;
    newconf += "serial_number=000000000" + line;
    //http://download.csdn.net/detail/fzel_net/4178287
    newconf += "model_url=http://wifi.network/" + line;
    newconf += "device_type=6-0050F204-1" + line;
    newconf += "friendly_name=Edge" + line;
    newconf += "manufacturer_url=http://www.edgerouter.com/" + line;
    newconf += "model_description=Development Version - EmergeLabs" + line;
    newconf += "uuid=" + uuid.v4() + line;

    newconf += "friendly_name=EdgeExp" + line;

    return newconf;
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

function Fetch(int, cb) {
    exec("hostapd_cli", "-p", sock, "-i", int, "all_sta", function (err, sta) {
        if (err) return cb(err);
        _parse(sta, cb);
    });
}

function _start_thunk(int) {
    return function (cb) {
        var conf = (int === "ap0" ? conf_5g : conf_2g);
        //if (!fs.existsSync(sock))
        //    fs.mkdirSync(sock);
        exec("killall", "hostapd", function () {
            var ps = child_process.spawn("hostapd", [conf], {detached: true, stdio: 'pipe'});
            ps.stdout.on('data', function (data) {
                console.log(data.toString().cyan);
            });
            ps.stderr.on('data', function (data) {
                console.log('ps stderr: ' + data.toString().red);
            });
            cb();
        });
    }
}

module.exports.Config2G = Config2G;
module.exports.Config5G = Config5G;
module.exports.Fetch = Fetch;
module.exports.Start2G = _start_thunk("ap1");
module.exports.Start5G = _start_thunk("ap0");
