import util = require("util");
import child_process = require("child_process");
import events = require("events");
import Process = require("./Process");

export class P0F extends Process {
    static P0F_NAME = "p0f";
    static P0F_FP = "/usr/local/p0f/p0f.fp";

    constructor(private interface:string, private dataHandler:Function) {
        super(P0F.P0F_NAME);
    }

    ConcatParams() {
        var params = ['-f', P0F.P0F_FP, '-i', this.interface];
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