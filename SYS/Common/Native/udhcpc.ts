import util = require("util");
import child_process = require("child_process");
import events = require("events");
import Process = require("./Process");

export class UDhcpC extends Process {
    static COMMAND_NAME = "udhcpc";

    constructor(){
        super(UDhcpC.COMMAND_NAME);
    }

    ConcatParams() {
        var params = ['-i', CONF.DEV.ETH.DEV_WAN, '-f'];
        return params;
    }

    Start(forever:boolean = true) {
        if (!this.IsChoking()) {

            if (this.Process) {
                this.Process.kill();
                info("OK");
                super.Start(forever);
            } else {
                killall(UDhcpC.COMMAND_NAME, () => {
                    this.Process = child_process.spawn(UDhcpC.COMMAND_NAME, this.ConcatParams());
                    this.Process.stdout.on("data", function (data) {
                        info(data.toString());
                    });
                    info("OK");
                    super.Start(forever);
                });
            }
        }
    }
}