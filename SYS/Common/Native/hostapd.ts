eval(LOG("Common:Native:hostapd"));

//http://ftp.netbsd.org/pub/NetBSD/NetBSD-current/src/external/bsd/wpa/dist/hostapd/README-WPS

//TODO: FIX WIRELSS THROUGHTPUT UNDER WPA CONDITIONS


import Process = require("./Process");
import child_process = require("child_process");
import events = require("events");
import fs = require("fs");
import path = require("path");

export enum ACL_TYPE {
    ACCEPT_UNLESS_DENY = 0,
    DENY_UNLESS_ACCEPT = 1
}

export enum _80211_BASE {
    B = -1,
    G = 0,
    N = 1,
    A = 2,
}

export enum RX_SPATIALSTREAM {
    NONE = 0,
    SINGLE = 1,
    DUAL = 2,
    TRIPLE = 3
}

export enum TX_SPATIALSTREAM {
    NONE = 0,
    SINGLE = 1
}

export class ConfigBase {

    Dev:string;
    Auto_SSID:boolean = true;

    Logger:{
        System: number;
        System_level: number;
        StdOut: number;
        StdOut_level: number;
    } = {
        System: -1,
        System_level: 2,
        StdOut: -1,
        StdOut_level: 2
    };

    Base:_80211_BASE = _80211_BASE.N;
    Bridge: string;
    SSID:string;
    Channel:number = 1;
    MaxStations:number = 255;
    MacAddressControl:ACL_TYPE = ACL_TYPE.ACCEPT_UNLESS_DENY;
    BSSID:string = undefined;
    HT_Capatability:{
        HT40?: boolean;
        SHORT_GI_20?: boolean;
        SHORT_GI_40?: boolean;
        TX_STBC?: TX_SPATIALSTREAM;
        RX_STBC?: RX_SPATIALSTREAM;
        DSSS_CCK_40?: boolean;
    } = {
        HT40: true,
        DSSS_CCK_40: true,
        TX_STBC: TX_SPATIALSTREAM.SINGLE,
        RX_STBC: RX_SPATIALSTREAM.SINGLE
    };

    BroadcastSSID:boolean = true;

    Password:string = "";

    BSS:IDic<{
        SSID: string;
        Password: string;
    }> = {};

}


function CfgString(conf:ConfigBase, dev, ctrl_sock, mac_accp, mac_deny) {

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

    newconf += "ctrl_interface=" + ctrl_sock + line;
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

    newconf += "accept_mac_file=" + mac_accp + line;
    newconf += "deny_mac_file=" + mac_deny + line;
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

    //warn("WARNING - HTCAP NOT IMPLEMENTED");
    //[SMPS-STATIC]

    //TODO: Fill HT_CAPAB
    //console.log(newconf);
    // newconf += "tx_queue_data3_aifs=7" + line;
    // newconf += "tx_queue_data3_cwmin=15" + line;
    // newconf += "tx_queue_data3_cwmax=1023" + line;
    // newconf += "tx_queue_data3_burst=0" + line;
    // newconf += "tx_queue_data2_aifs=3" + line;
    // newconf += "tx_queue_data2_cwmin=15" + line;
    // newconf += "tx_queue_data2_cwmax=63" + line;
    // newconf += "tx_queue_data2_burst=0" + line;
    // newconf += "tx_queue_data1_aifs=1" + line;
    // newconf += "tx_queue_data1_cwmin=7" + line;
    // newconf += "tx_queue_data1_cwmax=15" + line;
    // newconf += "tx_queue_data1_burst=3.0" + line;
    // newconf += "tx_queue_data0_aifs=1" + line;
    // newconf += "tx_queue_data0_cwmin=3" + line;
    // newconf += "tx_queue_data0_cwmax=7" + line;
    // newconf += "tx_queue_data0_burst=1.5" + line;
    return newconf;
}

export class CtrlInterface extends events.EventEmitter {

    static CONNECT = "connect";
    static DISCONNECT = "disconnect";
    static EVENT = "event";

    Dev:string;

    _command_stack:{
        cmd: string;
        cb: Function;
    }[] = [];

    _result_atom:string;

    _callback_atom:(err, data) => any;

    _client:any;

    _loc:string;

    _concheck:number = 0;

    _gtimer:any;

    _prevevent:string;

    Connected:boolean;

    constructor(dev, private sock_loc) {
        super();
        this.Dev = dev;
        this._loc = getSock(UUIDstr());
    }

    public start() {
        clearInterval(this._gtimer);
        this._gtimer = setInterval(this._guard, 1000);
    }

    public stop() {
        clearInterval(this._gtimer);
    }

    private _sta_recur = (curSTA:string, accuresult:{
        mac: string;
        STA: string;
    }[], maincallback) => {
        if (curSTA.trim() === "FAIL" || curSTA.trim() === "") {
            maincallback(null, accuresult);
        }
        else {
            var sp = curSTA.split('\n');
            var mac = sp[0];
            accuresult.push({
                mac: mac,
                STA: curSTA
            });
            this.STA_NEXT(mac, (err, result) => {
                this._sta_recur(result, accuresult, maincallback);
            });
        }
    };

    //TODO: add WPS sorta things

    public ALL_STA = (callback) => {
        this.STA_FIRST((err, result) => {
            this._sta_recur(result, [], callback);
        });
    };

    public STA_FIRST = (callback) => {
        this._cmd("STA-FIRST", callback);
    };

    public STA_NEXT = (mac, callback) => {
        this._cmd("STA-NEXT " + mac, callback);
    };

    public STA = (mac, callback) => {
        this._cmd("STA " + mac, callback);
    };

    public MIB = (callback) => {
        this._cmd("MIB", callback);
    };

    public NEW_STA = (mac, callback) => {
        this._cmd("NEW_STA " + mac, callback);
    };

    public DEAUTHENTICATE = (mac, callback) => {
        this._cmd("DEAUTHENTICATE " + mac, callback);
    };

    public DISASSOCIATE = (mac, callback) => {
        info("DEAUTH:" + mac);
        this._cmd("DISASSOCIATE " + mac, callback);
    };

    public PING = (callback) => {
        this._cmd("PING", callback);
    };

    public WPS_PUSHBTN = (callback) => {
        this._cmd("WPS_PBC", callback);
    };

    public WPS_CANCEL = (callback) => {
        this._cmd("WPS_CANCEL", callback);
    };
    
    private _pingCallback = (err, result) => {
        //swallow - 
    };

    private _cmd = (cmd, callback) => {
        if (this._callback_atom || this._command_stack.length > 0) {
            //plz wait yo
            this._command_stack.push({
                cb: callback,
                cmd: cmd
            });
        } else {
            //execute now
            this._exec(cmd, callback);
        }
    };

    private _exec = (cmd, callback) => {
        this._callback_atom = callback;
        var buf = new Buffer(cmd);
        this._client.send(buf, 0, buf.length, this._loc);
    }

    public Destroy() {
        clearInterval(this._gtimer);
        if (this._client) {
            try {
                this._client.close();
            }
            catch (e) {
                /*swallow*/
            }
        }
    }

    private _onrawdata = (buf, rinfo) => {
        var data:string = buf.toString().trim();
        this._result_atom += data;
        if (data.substr(0, 3) === "<3>") {
            if (this._prevevent !== data) {
                //EVENT
                var d = data.substr(3).split(' ');
                if(d.length > 1){
                    this._prevevent = data;
                    info('hostapd data', data);
                    this.emit(CtrlInterface.EVENT, d[0], d[1].toLowerCase());
                }
                else if(d.length > 0){
                    this._prevevent = data;
                    info('hostapd data', data);
                    this.emit(CtrlInterface.EVENT, d[0]);
                }
            }
        }
        else {
            //RESPONSE
            if (!this.Connected && this._result_atom === "OK") {
                trace("Probe Injected");
                clearTimeout(this._gtimer);
                this._gtimer = setInterval(this._guard, 5000);
                this.Connected = true;
                this.emit(CtrlInterface.CONNECT);
            }
            else if (this.Connected && this._callback_atom) {
                this._callback_atom(null, this._result_atom);
            }
            if (this._command_stack.length == 0) {
                this._callback_atom = undefined;
            }
            else {
                var next = this._command_stack.pop();
                this._exec(next.cmd, next.cb);
            }
        }
        this._result_atom = "";
        this._concheck = 0;
    };


    private _guard = () => {
        if (!this.Connected || this._concheck > 3) {
            if (this.Connected) {
                this.emit(CtrlInterface.DISCONNECT);
                clearInterval(this._gtimer);
                this._gtimer = setInterval(this._guard, 500);
                warn("Probe Offline - RECONNECTING...");
                this.Connected = false;
            }
            this._concheck = 0;
            if (this._client) {
                try {
                    this._client.close();
                }
                catch (e) {
                    /*swallow*/
                }
            }
            delete this._client;
            //try to (re)establish connection
            try {
                var unix = require("unix-dgram");
                var attach = new Buffer('ATTACH');
                var client = unix.createSocket('unix_dgram', this._onrawdata);
                //clean up a bit
                if (fs.existsSync(this._loc)) {
                    fs.unlinkSync(this._loc);
                }
                client.bind(this._loc);
                client.on('error', (e) => { /*swallow*/
                    error("HOSTAPD_ERROR:" + e);
                });
                client.send(attach, 0, attach.length, this.sock_loc);
                this._client = client;
            } catch (e) {
                warn("Ctrl Error.. ");
            }

        } else {
            //check
            this.PING(this._pingCallback);
            this._concheck += 1;
        }
    };
}

export class hostapd extends Process {

    public MAC_Accept = {};
    public MAC_Deny = {};

    public Config:ConfigBase;
    public Ctrl:CtrlInterface;

    private _path_conf = getSock(UUIDstr());
    private _path_accp = getSock(UUIDstr());
    private _path_deny = getSock(UUIDstr());
    private _path_sock = getSock(UUIDstr());

    _dev:string;

    public get Dev():string {
        return this._dev;
    }

    public set Dev(dev:string) {
        if (dev !== this._dev) {
            this._dev = dev;
            if (this.Ctrl) {
                this.Ctrl.stop();
                this.Ctrl.Destroy();
                this.Ctrl.removeAllListeners();
            }
            this.Config = new ConfigBase();
            this.Config.Dev = dev;
            this.Ctrl = new CtrlInterface(dev, path.join(this._path_sock, dev));
            if (this.Process) {
                //running
                super.Stop(true);
            }
        }
    }

    constructor(dev) {
        super("HOSTAPD_" + dev);
        this.Dev = dev;
    }

    private obj_to_strlst(arr) {
        var data = "";
        for (var p in arr) {
            data += p + "\r\n";
        }
        data = data.trim();
        return data;
    }

    Start(forever:boolean = true) {

        if (!this.IsChoking()) {
            this.Ctrl.start();

            var conf = CfgString(this.Config, this._dev, this._path_sock, this._path_accp, this._path_deny);
            var accp = this.obj_to_strlst(this.MAC_Accept);
            var deny = this.obj_to_strlst(this.MAC_Deny);

            var changed = false;
            if (didChange(this._path_conf, conf)) {
                changed = true;
                if (fs.existsSync(this._path_conf) && fs.unlinkSync(this._path_conf));
                fs.writeFileSync(this._path_conf, CfgString(this.Config, this._dev, this._path_sock, this._path_accp, this._path_deny));
            }

            if (didChange(this._path_accp, accp)) {
                changed = true;
                if (fs.existsSync(this._path_accp) && fs.unlinkSync(this._path_accp));
                fs.writeFileSync(this._path_accp, accp);
            }

            if (didChange(this._path_deny, deny)) {
                changed = true;
                if (fs.existsSync(this._path_deny) && fs.unlinkSync(this._path_deny));
                fs.writeFileSync(this._path_deny, deny);
            }


            //TODO: use DidChange to determine what to do!
            if (this.Process) {
                if (changed) {
                    this.Process.kill("SIGHUP"); //no more rebootz, BITCHES
                    //Actually, this does cause a reboot.
                    info("OK");
                    super.Start(forever);
                } else {
                    info("No change, skipped");
                }
            } else {
                //killall("hostapd", () => {
                this.Process = child_process.spawn("hostapd", [this._path_conf]);
                this.Process.stdout.on("data", function (data) {
                    info(data.toString());
                });
                info("OK");
                super.Start(forever);
                //});
            }
        }
    }

    Apply = (forever:boolean = true) => { //as helper method
        this.Start(forever);
    };

    OnChoke() {
        super.OnChoke();
        info("Killing all HostAPD processes");
        this.Process.removeAllListeners();
        //killall("hostapd",() => {
        this.Process.kill();
        this.Process = undefined;
        info("Done, waiting for recall");
        this.Choke_Timer = setTimeout(() => {
            this.ClearChoke();
            this.Start();
        }, 5000);
        //});
        return true;
    }

}

//recvfrom(13, "ATTACH", 4095, 0, {sa_family=AF_UNSPEC, sa_data="\256\356\17\10\0\347,\267\0\0\0\0002," }, [0]) = 6
//recvfrom(13, "ATTACH", 4095, 0, {sa_family=AF_LOCAL, sun_path="/tmp/wpa_ctrl_5055-1" }, [23]) = 6

/*
 * 
 *  var loc = "/var/run/hostapd/wlan1";
 var unix = require("unix-dgram");

 var message = Buffer('ATTACH');
 var MIB = Buffer('MIB');
 var client = unix.createSocket('unix_dgram',function(buf, rinfo) {
 console.log(buf + "");
 }
 );
 client.bind("/tmp/dogshit3");
 client.on('error', console.error);
 client.send(message, 0, message.length, loc);
 client.send(MIB, 0, MIB.length, loc);
 * 
 */


//https://github.com/realdesktop/wpa_supplicant/blob/a4d9a1df6175fd9c290b06770b0dc9f0af0bdfc8/hostapd/hostapd_cli.c
//hostapd_ctrl_iface_receive

//https://github.com/realdesktop/wpa_supplicant/blob/rds-initial/hostapd/ctrl_iface.c
/*
 *  PING
 *      -PONG
 *  RELOG
 *      -/
 *  MIB
 *      -?
 *  STA-FIRST
 *      - hostapd_ctrl_iface_sta
 *  STA {ADDR}
 *      - hostapd_ctrl_iface_sta
 *  STA-NEXT {ADDR}
 *      - hostapd_ctrl_iface_sta
 *  ATTACH
 *      - hostapd_ctrl_iface_attach
 *  DETACH
 *      - hostapd_ctrl_iface_detach
 *  LEVEL {ADDR}
 *      - hostapd_ctrl_iface_level
 *  NEW_STA {ADDR}
 *      - hostapd_ctrl_iface_new_sta
 *  DEAUTHENTICATE {ADDR}
 *      - hostapd_ctrl_iface_deauthenticate
 *  DISASSOCIATE {ADDR}
 *      - hostapd_ctrl_iface_disassociate
 *  GET_CONFIG
 *      - hostapd_ctrl_iface_get_config
 */
