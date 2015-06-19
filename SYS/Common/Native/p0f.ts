import util = require("util");
import net = require("net");
import child_process = require("child_process");
import events = require("events");
import Process = require("./Process");
import StatBiz = require('../Stat/StatBiz');

class P0F extends Process {
    static P0F_NAME = "p0f";
    static P0F_FP = "/usr/local/p0f/p0f.fp";
    static magicNumberReq = 0x50304601;
    static magicNumberResp = 0x50304602;
    static resOK = 0x10;

    public EVENT_DEVICE = 'P0F.Device';
    private sock:string;

    constructor(private interface:string) {
        super(P0F.P0F_NAME);
    }

    ConcatParams() {
        var params = ['-f', P0F.P0F_FP, '-i', this.interface];
        if (this.sock)
            params = params.concat(['-s', this.sock]);
        return params;
    }

    /**
     { browser: { name: 'IEMobile', version: '11.0', major: '11' },
       engine: { name: 'Trident', version: '7.0' },
       os: { name: 'Windows Phone', version: '8.1' },
       device: { model: undefined, vendor: 'Nokia', type: 'mobile' },
       cpu: { architecture: undefined } }
     */
    __parseDeviceInfo(data) {
        var exp = /client\s+= ([^\/]+)/gmi.exec(data);
        var ip = exp && exp.length > 1 ? exp[1] : null;
        if (ip) {
            //console.log('=======<<< p0f ip: ', ip);
            return {
                ip: ip,
                hwaddr: StatBiz.GetMacByIP(ip),
                ua: data
            };
        }
        return null;
    }

    /**
     .-[ 192.168.1.10/53680 -> 22.33.99.201/80 (http request) ]-
     |
     | client   = 192.168.1.10/53680
     | app      = ???
     | lang     = Chinese
     | params   = none
     | raw_sig  = 1:Host,Connection=[keep-alive],Accept=[*/
    /*],User-Agent,Accept-Language=[zh-cn],?Referer,Accept-Encoding=[gzip, deflate]:Accept-Charset,Keep-Alive:Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4
     |
     `----

     .-[ 192.168.1.11/51130 -> 92.61.148.154/80 (http request) ]-
     |
     | client   = 192.168.1.11/51130
     | app      = ???
     | lang     = English
     | params   = none
     | raw_sig  = 1:Accept=[text/html, application/xhtml+xml, */
    /*],Accept-Language=[en-US,zh-Hans-CN;q=0.9,zh-Hans;q=0.7,en-GB;q=0.6,en;q=0.4,zh-Hant-HK;q=0.3,zh-Hant;q=0.1],User-Agent,UA-CPU=[ARM],Accept-Encoding=[gzip, deflate],Host,DNT=[1],Connection=[Keep-Alive]:Accept-Charset,Keep-Alive:Mozilla/5.0 (Mobile; Windows Phone 8.1; Android 4.0; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; 909) like iPhone OS 7_0_3 Mac OS X AppleWebKit/537 (KHTML, like Gecko) Mobile Safari/537
     |
     `----

     .-[ 192.168.66.10/54103 -> 94.31.29.154/80 (http request) ]-
     |
     | client   = 192.168.66.10/54103
     | app      = ???
     | lang     = Chinese
     | params   = none
     | raw_sig  = 1:Host,Connection=[keep-alive],?Cache-Control,Accept=[text/css,*/
    /*;q=0.1],?If-None-Match,?If-Modified-Since,User-Agent,?Referer,Accept-Encoding=[gzip, deflate, sdch],Accept-Language=[zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4,ja;q=0.2]:Accept-Charset,Keep-Alive:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36
     |
     `----
     */
    __handleP0fOutput(data) {
        var info = data.toString();
        if (/\(http request\)/.test(info)) {
            var description = <any>this.__parseDeviceInfo(info);
            if (description && description.ip && description.hwaddr) {
                this.Query(description.ip, (err, assumption) => {
                    if (err) error(err);
                    else {
                        description.assumption = assumption;
                        this.emit(this.EVENT_DEVICE, description.ip, description);
                        //console.log('p0f description --------->>>> ', description);
                    }
                });
            }
        }
    }

    Start(forever:boolean = true) {
        if (!this.IsChoking()) {

            if (this.Process) {
                this.Process.kill("SIGHUP"); //no more rebootz, BITCHES
                info("OK");
                super.Start(forever);
            } else {
                killall(P0F.P0F_NAME, () => {
                    this.sock = getSock(UUIDstr());
                    this.Process = child_process.spawn(P0F.P0F_NAME, this.ConcatParams());
                    ((self) => {
                        self.Process.stdout.on("data", (data) => {
                            self.__handleP0fOutput(data);
                        });
                    })(this);
                    info("OK");
                    super.Start(forever);
                });
            }
        }
    }

    private _parseData(data) {
        var header = data.readUInt32LE(0);
        if (header === P0F.magicNumberResp) {
            var res = data.readUInt32LE(4);
            if (res === P0F.resOK) {
                var buf = new Buffer(32);
                var firstSeen = new Date(data.readUInt32LE(8) * 1000);
                var lastSeen = new Date(data.readUInt32LE(12) * 1000);
                var totalConn = data.readUInt32LE(16);
                var uptime_min = data.readUInt32LE(20);
                var up_mod_days = data.readUInt32LE(24);
                var last_nat = data.readUInt32LE(28);
                var last_chg = data.readUInt32LE(32);
                var distance = data.readUInt16LE(36);
                var bad_sw = data.readUInt8(38);
                var os_match_q = data.readUInt8(39);
                data.copy(buf, 0, 40, 71);
                var os_name = buf.toString('utf8').split('\0')[0];
                data.copy(buf, 0, 72, 103);
                var os_flavor = buf.toString('utf8').split('\0')[0];
                data.copy(buf, 0, 104, 135);
                var http_name = buf.toString('utf8').split('\0')[0];
                data.copy(buf, 0, 136, 167);
                var http_flavor = buf.toString('utf8').split('\0')[0];
                data.copy(buf, 0, 168, 199);
                var link_type = buf.toString('utf8').split('\0')[0];
                data.copy(buf, 0, 200, 231);
                var language = buf.toString('utf8').split('\0')[0];
                return {
                    firstSeen: firstSeen,
                    lastSeen: lastSeen,
                    totalConn: totalConn,
                    uptime_min: uptime_min,
                    up_mod_days: up_mod_days,
                    last_nat: last_nat,
                    last_chg: last_chg,
                    distance: distance,
                    bad_sw: bad_sw,
                    os_match_q: os_match_q,
                    os_name: os_name,
                    os_flavor: os_flavor,
                    http_name: http_name,
                    http_flavor: http_flavor,
                    link_type: link_type,
                    language: language
                };
            }
        }
        return null;
    }

    /**
     {
           firstSeen: firstSeen,
           lastSeen: lastSeen,
           totalConn : totalConn,
           uptime_min: uptime_min,
           up_mod_days: up_mod_days,
           last_nat: last_nat,
           last_chg: last_chg,
           distance: distance,
           bad_sw: bad_sw,
           os_match_q : os_match_q,
           os_name: os_name,
           os_flavor : os_flavor,
           http_name: http_name,
           http_flavor: http_flavor,
           link_type: link_type,
           language: language
       }
     */
    public Query(ip:string, callback:Callback) {
        ((self) => {
            if (!self.sock) {
                return callback(new Error('P0F service is not running.'));
            }

            var client = net.createConnection(self.sock);

            client.on('connect', function () {
                var data = new Buffer(21);
                data.writeUInt32LE(P0F.magicNumberReq, 0);
                data.writeUInt8(0x04, 4);
                var ips = ip.split('.').map(function (i) {
                    return parseInt(i)
                });
                for (var i = 0, len = ips.length; i < len; i++)
                    data.writeUInt32LE(ips[i], i + 5);
                client.write(data, 'binary');
            });

            client.on('error', function (err) {
                error(err);
                return callback(err);
            });

            var result = null;
            client.on('data', function (data) {
                result = self._parseData(data);
                client.destroy();
            });
            client.on('close', function () {
                return callback(null, result);
            });
        })(this);
    }

    Stop(restart:boolean = false) {
        this.removeAllListeners();
        super.Stop(restart);
    }

    OnChoke() {
        super.OnChoke();
        info("Killing all PPPD processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall(P0F.P0F_NAME, () => {
            info("Done, waiting for recall");
            setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 2000);
        });
        return true;
    }
}

export var P0FInstance = new P0F(CONF.DEV.WLAN.WLAN_BR);

export function Initialize(cb) {
    P0FInstance.Start(true);
    cb();
}