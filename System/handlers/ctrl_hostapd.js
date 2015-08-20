var conf="/ramdisk/System/externals/configs/hostapd.conf"

function Config(cb) {
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
    var conf = (function () {
        function ConfigBase() {
            this.Auto_SSID = true;
            this.Logger = {
                System: -1,
                System_level: 2,
                StdOut: -1,
                StdOut_level: 2
            };
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
            this.Password = "";
            this.BSS = {};
        }
        return ConfigBase;
    })();

    fs.writeFile(conf, Cfg2String(conf), cb);
}

function Cfg2String(conf) {
    var newconf = "";
    var line = "\n";
    newconf += "interface=" + conf.Dev + line;
    if (conf.Bridge){
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

    newconf += "ctrl_interface=/tmp/fdsock/hostapd_aps/"  + line;
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
    newconf += "uuid=87654321-9abc-def0-1234-56789abc0000" + line;

    newconf += "friendly_name=Edge" + line;

    return newconf;
}

module.exports.Config = Config;