import Node = require("Node");
import Core = require("Core");

export var NGINX_PERM_ARR = [Permission.Proxy];
export var NGINX_PERMISSION = Core.API.Permission.Encode(NGINX_PERM_ARR);

function ConnectionHandler(
    credential: { uid; pid; gid; },
    socket: Node.net.Socket,
    callback: (handled: boolean) => any
    ) {
    trace("RPC Socket Scan (PROXY) ~ " + credential.pid);

    if (!NginxInstance || NginxInstance.IsChoking()
        || !NginxInstance.Process) {
        trace("NO MATCH, Moving on.. " + credential.pid);
        return callback(undefined);
    }
    exec("ps", "-p", credential.pid, "-o", "ppid=", (err, result) => {
        if (!err && Number(result.trim()) == NginxInstance.Process.pid) {
            trace("Proxy Socket Inbound " + credential.pid);
            Core.API.Permission.SetPermission(nginx_runtime_id, NGINX_PERMISSION);
            //Start serving STUFF
            Core.API.Server.Serve(socket, CONF.SENDER_TYPE_PROXY, nginx_runtime_id,
                undefined);
            info("Proxy RPC is Bound with " + credential.pid);
        }
        else if (err) {
            warn("Error fetching parent pid " + credential.pid);
            callback(undefined);
        }
        else {
            trace("NO MATCH, Moving on.. " + credential.pid);
            callback(undefined);
        }
    });
}


var nginx_runtime_id;
export var NginxInstance: Core.SubSys.Native.nginx.nginx;

export function Initialize(cb) {
    nginx_runtime_id = UUIDstr();
    NginxInstance = new Core.SubSys.Native.nginx.nginx(NGINX_PERMISSION);
    NginxInstance.Ctrl.Init((err) => {
        cb(err);
        SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
            //Add this to the bottom, cause we are using ps command to filter out credentials
            //thus slows everything down :p
            Core.API.Server.AddHandler(ConnectionHandler);
            async.series([
                require("./MainUI").Initialize,
                require("./WebEx").Initialize
            ],() => {
                    NginxInstance.Start(true);
            });
        });
    });
}



__API((cb) => { cb(undefined, "=w= GOOD!"); }, "Proxy.SelfTest", NGINX_PERM_ARR);