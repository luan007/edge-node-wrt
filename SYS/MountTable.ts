import child_process = require('child_process');
import path = require('path');
import APIConfig = require('./APIConfig');
import Process = require("../System/SubSys/Native/Process");

/**
 * interior data structure:
 *  mapping: { moduleName: { moduleName, pid, mount, rpc, [funcid...] } }
 *  pidMapping: { pid: moduleName }
 */
export class MountTable {
    private static mapping = {};
    private static pidMapping = {};

    public static MountNewSystemModule(moduleName, modulePath, socketPath) {
        MountTable.mapping[moduleName] = {};
        var mount = new Mount(moduleName, modulePath, socketPath);
        MountTable.SetProcess(moduleName, mount.Process.pid, mount);
    }

    public static Restart(moduleName) {
        var mountInfo = MountTable.mapping[moduleName];
        if (mountInfo) mountInfo.mount.Stop(true); // restart process
    }

    public static SetProcess(moduleName, pid, mount) {
        var oldPid = MountTable.mapping[moduleName]['pid'];
        if (oldPid) delete MountTable.pidMapping[oldPid];
        MountTable.mapping[moduleName]['moduleName'] = moduleName;
        MountTable.mapping[moduleName]['pid'] = pid;
        MountTable.mapping[moduleName]['mount'] = mount;
        MountTable.pidMapping[pid] = moduleName;
    }

    public static SetRPC(moduleName, rpc) {
        MountTable.mapping[moduleName]['rpc'] = rpc;
    }

    public static GetByFuncId(funcid) {
        var funcInfo = APIConfig.getAPIConfig()[funcid];
        if (funcInfo && funcInfo.moduleName) return MountTable.mapping[funcInfo.moduleName];
        return null;
    }

    public static GetByPid(pid) {
        //trace('GetByPid', pid);
        var moduleName = MountTable.pidMapping[pid];
        var rpc = MountTable.mapping[moduleName];
        //if (rpc) trace('GetByPid found', pid);
        return rpc;
    }

    public static SetPidRPC(pid, rpc) {
        var moduleName = '__' + pid;
        MountTable.pidMapping[pid] = moduleName;
        MountTable.mapping[moduleName] = {
            pid: pid
            , rpc: rpc
        };
    }
}

class Mount extends Process {
    public moduleName:string;
    public modulePath:string;
    public socketPath:string;
    private static ProxyPath = path.join(__dirname, 'Proxy');

    constructor(moduleName, modulePath, socketPath) {
        super(moduleName);
        this.moduleName = moduleName;
        this.modulePath = modulePath;
        this.socketPath = socketPath;
        this.Start(true);
    }

    Start(forever:boolean = true) {
        if (!this.IsChoking()) {
            if (this.Process) {
                this.Process.kill('SIGHUP');
                info("OK");
                super.Start(forever);
            } else {
                trace('Mount.ProxyPath', Mount.ProxyPath);
                this.Process = child_process.spawn('node'
                    , [Mount.ProxyPath
                        , this.moduleName
                        , path.join(process.env.NODE_PATH, this.modulePath)
                        , this.socketPath
                        , process.env.apiConfigFilePath]);
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
