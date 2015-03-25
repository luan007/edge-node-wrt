import Process = require("./Process");
import child_process = require("child_process");
import events = require("events");
import fs = require("fs");
import path = require("path");
import net = require("net");
import bluez = require("./bluez");


//Events: data(bf), end(), error(e)
export class ObexpushObject extends events.EventEmitter {

    private _act = false;

    constructor(public Properties: {
        From: string;
        Length: number;
        Name: string;
        Path: string;
    }, private socket) {
        super();
    }

    public Accept = () => {
        if (!this._act) {
            this._act = true;
            this.socket.write("OK\n");
        }
    };

    public Decline = () => {
        if (!this._act) {
            this._act = true;
            this.socket.end();
            this.socket.removeAllListeners();
        }
    };
}

export class Obexpushd extends Process {

    public Channel = 9;

    public Iface = CONF.DEV.BLUETOOTH.DEV_HCI;

    private _lnkpath;

    private _sockpath;

    private _script;

    private server;

    constructor() {
        super("Obexpushd");
        this._lnkpath = getSock(UUIDstr());
        this._sockpath = getSock(UUIDstr());
        this._script = "socat UNIX-CONNECT:" + this._sockpath + " - ";
        this.server = net.createServer(this._on_conn_);
        this.server.listen(this._sockpath);
    }

    private _on_conn_ = (client: net.Socket) => {
        //handle dirty logics
        var obex: ObexpushObject = undefined;
        var id = UUIDstr();
        client.on("data",(d: Buffer) => {
            if (!obex) {
                var c = d.toString().split('\n');
                var obj = <any>{};
                for (var i = 0; i < c.length; i++) {
                    if (c[i].trim().length && c[i].split(":").length) {
                        if (c[i].split(":")[0] !== "From") {
                            obj[c[i].split(":")[0]] = c[i].split(":")[1].trim();
                        } else {
                            obj[c[i].split(":")[0]] = c[i].substr(5).trim();
                        }
                    }
                }
                if (!obj.From || !obj.Length || !obj.Name) {
                    client.removeAllListeners("data");
                    client.removeAllListeners("end");
                    return client.end();
                }
                else {
                    obj.From = obj.From.split("[")[1].split("]")[0];
                    obj.Length = parseInt(obj.Length);
                    obex = new ObexpushObject(obj, client);
                    this.emit("connection", obex);
                }
            } else {
                obex.emit("data", d);
            }
        });

        var done = () => {
            obex.emit("end");
            client.removeAllListeners("data");
            client.removeAllListeners("end");
        };

        var error = (e) => {
            obex.emit("error", e);
            client.removeAllListeners("data");
            client.removeAllListeners("end");
        };

        client.on("error", error);
        client.on("end", done);
        client.on("close", done);
    };

    Start(forever: boolean = true) {

        async.series(
            [
                exec.bind(null, "rm -rf " + this._lnkpath),
                fs.writeFile.bind(null, this._lnkpath, this._script),
                exec.bind(null, "chmod 777 " + this._lnkpath)
            ],() => {
                killall("obexpushd",() => {
                    this.Process = child_process.spawn("obexpushd",
                        [
                            '-n',
                            '-B',
                            this.Iface + ":" + this.Channel,
                            '-s',
                            this._lnkpath
                        ]);
                    info("OK");
                    super.Start(forever);
                });
            });
    }

    Apply = (forever: boolean = true) => { //as helper method
        this.Start(forever);
    };

    OnChoke() {
        super.OnChoke();
        info("Killing all OBEX processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall("obexpushd",() => {
            info("Done, waiting for recall");
            //let's wait till bluetooth is up, ok?
            var _try = () => {
                clearTimeout(this.Choke_Timer);
                if (bluez.Bluez.Instance && bluez.Bluez.Instance.Process) {
                    this.ClearChoke();
                    this.Start();
                } else {
                    this.Choke_Timer = setTimeout(_try, 2000);
                }
            };
            this.Choke_Timer = setTimeout(_try, 2000);
        });
        return true;
    }
}

