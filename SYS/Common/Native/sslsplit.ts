eval(LOG("Common:Native:SSLSplit"));

import util = require("util");
import child_process = require("child_process");
import events = require("events");
import path = require("path");
import Process = require("./Process");

export class SSLSplit extends Process {
    static COMMAND_NAME = "sslsplit";
    
    private line = 0;
    
    constructor(){
        super(SSLSplit.COMMAND_NAME);
    }

    Start(forever:boolean = true) {
        this.line = 0;
        if (!this.IsChoking()) {
            if (this.Process) {
                this.Process.kill();
                info("OK");
                super.Start(forever);
            } else {
                killall(SSLSplit.COMMAND_NAME, () => {
                    exec("cp", "-rf" ,"/ramdisk/Modules/Lua/modify.lua", "/tmp/modify.lua", () => {
                        exec("chmod", "777", "/tmp/modify.lua", () => {
                            this.Process = child_process.spawn(SSLSplit.COMMAND_NAME, [
                                "-M", "/tmp/modify.lua",
                                //"-D",
                                "-c", "/ramdisk/SYS/Common/Crypto/Keys/cert.crt",
                                "-k", "/ramdisk/SYS/Common/Crypto/Keys/cert.key",
                                "https", "0.0.0.0", "3128" ,"http", "0.0.0.0", "3378"
                            ]);
                            //this.Process.stdout.on("data", function (data) {
                            //    info(data.toString());
                            //});
                            this.Process.stderr.on("data", function (data) {
                                this.line += 1;
                                info(data.toString());
                                setTask("sslsplit_idlekill", ()=>{
                                    if(this.line > 100) {
                                        killall(SSLSplit.COMMAND_NAME, () => { info("SSLSPLIT SWIPE..") });
                                    }
                                }, 5000);
                            });
                            info("OK");
                            super.Start(forever);
                        });
                    });
                });
            }
        }
    }

    OnChoke() {
        super.OnChoke();
        info("Killing all SSLSplit processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall(SSLSplit.COMMAND_NAME, () => {
            info("Done, waiting for recall");
            setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 2000);
        });
        return true;
    }
}