import util = require("util");
import net = require("net");
import child_process = require("child_process");
import events = require("events");
import Process = require("./Process");

export class P0F extends Process {
    static P0F_NAME = "p0f";
    static P0F_FP = "/usr/local/p0f/p0f.fp";
    static magicNumberReq = 0x50304601;
    static magicNumberResp = 0x50304602;
    static resOK = 0x10;

    constructor(private interface:string, private dataHandler:Function, private sock?:string) {
        super(P0F.P0F_NAME);
    }

    ConcatParams() {
        var params = ['-f', P0F.P0F_FP, '-i', this.interface];
        if(this.sock)
            params = params.concat(['-s', this.sock]);
        return params;
    }

    Start(forever:boolean = true) {
        if (!this.IsChoking()) {

            if (this.Process) {
                this.Process.kill("SIGHUP"); //no more rebootz, BITCHES
                info("OK");
                super.Start(forever);
            } else {
                killall(P0F.P0F_NAME, () => {
                    this.Process = child_process.spawn(P0F.P0F_NAME, this.ConcatParams());
                    this.Process.stdout.on("data", this.dataHandler);
                    info("OK");
                    super.Start(forever);
                });
            }
        }
    }

    private _parseData(data) {
        var header = data.readUInt32LE(0);
        if(header === P0F.magicNumberResp) {
            var res = data.readUInt32LE(4);
            if(res === P0F.resOK) {
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
                var os_name = buf.toString('utf8').replace(/[\0\t\b]/g, '');
                data.copy(buf, 0, 72, 103);
                var os_flavor = buf.toString('utf8').replace(/[\0\t\b]/g, '');
                data.copy(buf, 0, 104, 135);
                var http_name = buf.toString('utf8').replace(/[\0\t\b]/g, '');
                data.copy(buf, 0, 136, 167);
                var http_flavor = buf.toString('utf8').replace(/[\0\t\b]/g, '');
                data.copy(buf, 0, 168, 199);
                var link_type = buf.toString('utf8').replace(/[\0\t\b]/g, '');
                data.copy(buf, 0, 200, 231);
                var language = buf.toString('utf8').replace(/[\0\t\b]/g, '');
                return {
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
                };
            }
        }
        return null;
    }

    Query(ip:string, callback:Callback) {
        ((self) => {
            if(!self.sock) {
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