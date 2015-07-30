eval(LOG("Common:Native:pppd"));

import util = require("util");
import child_process = require("child_process");
import events = require("events");
import Process = require("./Process");
import IpRoute2 = require('./iproute2');
import ip = IpRoute2;

export class PPPStatus {
    static Offline:string = "Offline";
    static Online:string = "Online";
}

/*
 man pppd
 https://wiki.archlinux.org/index.php/Pppd

 # command line:
 # pppd plugin /usr/lib/ppd/rp-pppoe.so eth0 usepeerdns nodefaultroute nodetach user <user> password <pwd> mtu 1492 mru 1492
 */
export class PPPoEDaemon extends Process {
    static PPPD_NAME = "pppd";
    static RP_PPPOE_SO = "/usr/lib/pppd/2.4.7/rp-pppoe.so";

    public Options:IDic<string>
    public Account:string;
    public Passwd:string;
    public PPPNumber:number;

    private status:PPPStatus = PPPStatus.Offline;

    constructor(account:string, passwd:string, pppNumber:number, opts?:IDic<string>) {
        super(PPPoEDaemon.PPPD_NAME);

        this.RegisterEvents();

        this.Account = account;
        this.Passwd = passwd;
        this.Options = opts;
        this.PPPNumber = pppNumber;
    }

    PPPStatus() {
        return this.status;
    }

    OnNewDevice(device) {
        if (device === "ppp" + this.PPPNumber) {
            info(device, PPPStatus.Online);
            this.status = PPPStatus.Online;
        }
    }
    OnDelDevice(device){
        if (device === "ppp" + this.PPPNumber) {
            info(device, PPPStatus.Offline);
            this.status = PPPStatus.Offline;
        }
    }

    RegisterEvents() {
        ip.Link
            .on("new", this.OnNewDevice)
            .on("del", this.OnDelDevice);
    }
    RemoveEvents(){
        ip.Link
            .removeListener("new", this.OnNewDevice)
            .removeListener("del", this.OnDelDevice);
    }

    ConcatParams() {
        var params = ['unit', this.PPPNumber.toString(), 'plugin', PPPoEDaemon.RP_PPPOE_SO, 'nodetach'];
        for (var k in this.Options)
            params = params.concat([k, this.Options[k]]);
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
                    this.Process = child_process.spawn(PPPoEDaemon.PPPD_NAME, this.ConcatParams());
                    this.Process.stdout.on("data", function (data) {
                        info(data.toString());
                    });
                    info("OK");
                    super.Start(forever);
                });
            }
        }
    }

    Stop(restart:boolean = false) {
        this.RemoveEvents();
    }

    Apply = (forever:boolean = true) => { //as helper method
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
