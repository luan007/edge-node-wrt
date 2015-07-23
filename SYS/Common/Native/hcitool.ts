import child_process = require("child_process");
import events = require("events");
import fs = require("fs");
import path = require("path");
import util = require("util");
import Process = require("./Process");

var mac_list = {};
function __exists(MAC) {
    return has(mac_list, MAC);
}
function __add(MAC) {
    if (!has(mac_list, MAC))
        mac_list[MAC] = 1;
}
function __done(MAC) {
    delete mac_list[MAC];
}

export class HCITool extends Process {
    static HCI_NAME = "hcitool";
    static ROW_REGEXP = /([A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}) (.*)/gmi;

    constructor() {
        super("HCITool");
    }

    __handleHCIOutput(data) {
        var rows = data.split('\n');
        if(rows){
            rows.forEach((row)=>{
                var matched = HCITool.ROW_REGEXP.exec(row);
                if (matched && matched.length > 2) {
                    var mac = matched[1].toString().toLowerCase();
                    if (!__exists(mac)) {
                        __add(mac);
                        var name = matched[2];
                        trace("hcitool row:", row, mac, name);
                        this.emit("UP", mac, name);
                    }
                }
            });
        }
    }

    Start(forever:boolean = true) {
        var jobs = [
            (cb)=> {exec("hciconfig", CONF.DEV.BLUETOOTH.DEV_HCI, "down", ignore_err(cb)); },
            (cb)=> {exec("hciconfig", CONF.DEV.BLUETOOTH.DEV_HCI, "up", ignore_err(cb)); }
        ];

        if (this.Process) {
            async.series(jobs,() => {
                info("UPDATE");
            });
        } else {
            killall(HCITool.HCI_NAME, () => {
                async.series(jobs, ()=>{
                    this.Process = child_process.spawn(HCITool.HCI_NAME, ["-i", CONF.DEV.BLUETOOTH.DEV_HCI, "lescan"]);
                    ((self) => {
                        self.Process.stdout.on("data", (data) => {
                            self.__handleHCIOutput(data.toString());
                        });
                    })(this);
                    info("OK");
                    super.Start(forever);
                });
            });
        }
    }

    OnChoke() {
        super.OnChoke();
        info("Killing all HCITool processes");
        var jobs = [
            (cb)=> {exec("hciconfig", CONF.DEV.BLUETOOTH.DEV_HCI, "down", ignore_err(cb)); },
            (cb)=> {exec("hciconfig", CONF.DEV.BLUETOOTH.DEV_HCI, "up", ignore_err(cb)); }
        ];
        async.series(jobs, () => {
            this.Process.removeAllListeners();
            this.Process.kill();
            this.Process = undefined;
            info("Done, waiting for recall");
            this.Choke_Timer = setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 5000);
        });

        //});
        return true;
    }
}