import Core = require("Core");
import Node = require("Node");
import fs = require("fs");
import util = require("util");
import child_process = require("child_process");
import Process = require("./Process");

class PPPDaemon extends Process {
    static PPPD_NAME = "pppd";

    private _account:string;
    private _passwd:string;

    constructor(account:string, passwd:string) {
        super(PPPDaemon.PPPD_NAME);

        this._account = account;
        this._passwd = passwd;
    }

    Start(forever:boolean = true) {
        if (!this.IsChoking()) {

            if (this.Process) {
                this.Process.kill("SIGHUP"); //no more rebootz, BITCHES
                info("OK");
                super.Start(forever);
            } else {
                killall(PPPDaemon.PPPD_NAME, () => {
                    this.Process = child_process.spawn(PPPDaemon.PPPD_NAME, [
                        util.format('connect "chat %s"', '-f dial-c3po'),
                        "eth0",
                        "38400",
                        "-detach crtscts modem defaultroute"]);
                    this.Process.stdout.on("data", function (data) {
                        info(data.toString());
                    });
                    info("OK");
                    super.Start(forever);
                });
            }
        }
    }

    Apply = (forever: boolean = true) => { //as helper method
        this.Start(forever);
    };

    OnChoke() {
        super.OnChoke();
        info("Killing all PPPD processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall(PPPDaemon.PPPD_NAME, () => {
            info("Done, waiting for recall");
            setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 2000);
        });
        return true;
    }
}