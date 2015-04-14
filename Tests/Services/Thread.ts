import child_process = require('child_process');
import path = require('path');
import Process = require("../../System/SubSys/Native/Process");

export class Thread extends Process {
    public modulePath:string;
    public sockPath:string;

    constructor(modulePath, sockPath) {
        super();
        this.modulePath = modulePath;
        this.sockPath = sockPath;
        this.Start(true);
    }

    Start(forever:boolean = true) {
        if (!this.IsChoking()) {
            if (this.Process) {
                this.Process.kill('SIGHUP');
                info("OK");
                super.Start(forever);
            } else {
                trace('Thread.modulePath', this.modulePath);
                this.Process = child_process.spawn('node', [this.modulePath, this.sockPath]);
                this.Process.stdout.on("data", function (data) {
                    info(data.toString());
                });
                this.Process.stderr.on('data', function (data) {
                    error(data.toString());
                });
                info("OK");
                super.Start(forever);
            }
        }
    }

    OnChoke() {
        super.OnChoke();
        this.Stop();
        (() => {
            info("Done, waiting for recall");
            setTimeout(() => {
                this.ClearChoke();
                this.Start(true);
            }, 2000);
        })();
        return true;
    }
}