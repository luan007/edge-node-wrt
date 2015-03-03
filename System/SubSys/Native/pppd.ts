import Core = require("Core");
import Node = require("Node");
import fs = require("fs");
import util = require("util");
import child_process = require("child_process");
import Process = require("./Process");

/*
 man pppd
 https://wiki.archlinux.org/index.php/Pppd

 # command line:
 # pppd plugin rp-pppoe.so syncppp $n mtu 1492 mru 1492 nic-$ifname nopersist usepeerdns nodefaultroute user $user password $pass ipparam $interface ifname pppoe-$interface
 */
class PPPoEDaemon extends Process {
    static PPPD_NAME = "pppd";
    static RP_PPPOE_SO = "/usr/lib/pppd/rp-pppoe.so";

    public Options: IDic<string>
    public Account:string;
    public Passwd:string;
    public PPPNumber: number;

    constructor(account:string, passwd:string, pppNumber: number, opts?: IDic<string>) {
        super(PPPoEDaemon.PPPD_NAME);

        this.Account = account;
        this.Passwd = passwd;
        this.Options = opts;
        this.PPPNumber = pppNumber;
    }

    ConcatParams(){
        var params = util.format("unit %d plugin %s user %s password %s", this.PPPNumber,
            PPPoEDaemon.RP_PPPOE_SO, this.Account, this.Passwd);
        for(var k in this.Options)
            params += util.format("%s %s", k, this.Options[k]);
        return params;
    }

    Start(forever:boolean = true) {
        if (!this.IsChoking()) {

            if (this.Process) {
                this.Process.kill("SIGHUP"); //no more rebootz, BITCHES
                info("OK");
                super.Start(forever);
            } else {
                killall(PPPoEDaemon.PPPD_NAME, () => {
                    this.Process = child_process.spawn(PPPoEDaemon.PPPD_NAME, [
                        this.ConcatParams()
                    ]);
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
        killall(PPPoEDaemon.PPPD_NAME, () => {
            info("Done, waiting for recall");
            setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 2000);
        });
        return true;
    }
}