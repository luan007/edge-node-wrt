import child_process = require('child_process');
import path = require('path');
import APIConfig = require('./APIConfig');
import Process = require("../System/SubSys/Native/Process");

/**
 * interior data structure:
 *  mapping: { moduleName: { pid, mount, rpc, [funcid...] } }
 *  pidMapping: { pid: moduleName }
 */
export class MountTable {
    private static mapping = {};
    private static pidMapping = {};

    public static MountNew(moduleName, modulePath, socketPath) {
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
        MountTable.mapping[moduleName]['pid'] = pid;
        MountTable.mapping[moduleName]['mount'] = mount;
        MountTable.pidMapping[pid] = moduleName;
    }

    public static SetRPC(moduleName, rpc) {
        MountTable.mapping[moduleName]['rpc'] = rpc;
    }

    public static Get(funcid) {
        var funcInfo = APIConfig.getAPIConfig()[funcid];
        if (funcInfo && funcInfo.moduleName) return MountTable.mapping[funcInfo.moduleName];
        return null;
    }

    public static GetByPid(pid) {
        var moduleName = MountTable.pidMapping[pid];
        return MountTable.mapping[moduleName];
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
                console.log('Mount.ProxyPath', Mount.ProxyPath);
                this.Process = child_process.spawn('node'
                    , [Mount.ProxyPath
                        , this.moduleName
                        , path.join(process.cwd(), this.modulePath)
                        , this.socketPath]);
                this.Process.stdout.on("data", function (data) {
                    info(data.toString());
                });
                this.Process.on('error', function (err) {
                    error(err);
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
