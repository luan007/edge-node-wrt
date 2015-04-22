import child_process = require('child_process');
import path = require('path');
import Process = require("../../System/SubSys/Native/Process");
import pm = require('../../System/API/Permission');
require('../../System/API/PermissionDef');

export class Thread extends Process {
    public modulePath:string;
    public sockPath:string;

    constructor(modulePath, sockPath) {
        super('');
        this.modulePath = modulePath;
        this.sockPath = sockPath;
        this.Start(false);
    }

    Start(forever:boolean = true) {
        if (!this.IsChoking()) {
            if (this.Process) {
                this.Process.kill('SIGHUP');
                info("OK");
                super.Start(forever);
            } else {
                this.Process = child_process.spawn('node', [this.modulePath, this.sockPath]);

                // set permission
                pm.SetPermission(this.Process.pid, pm.Encode([Permission.System]));

                ((__this) => {
                    this.Process.stdout.on("data", function (data) {
                        var str = data.toString();
                        if (/RESULT: SUCCESS/.test(str)) {
                            __this.emit('SUCCESS'); // thread success.
                            __this.removeAllListeners();
                            __this.Stop();
                        }
                        //else if(/RESULT: FAILED/.test(str)) {
                        //    __this.emit('FAILED'); // thread success.
                        //    __this.removeAllListeners();
                        //    __this.Stop();
                        //}
                        else
                            info(str);
                    });
                    this.Process.stderr.on('data', function (data) {
                        error(data.toString());
                    });
                    this.Process.on('exit', () => {
                        __this.emit('FAILED'); // thread success.
                    })
                })(this);
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