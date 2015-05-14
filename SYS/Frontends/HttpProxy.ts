import net = require('net');
import fs = require('fs');
import path = require('path');
import PermissionLib = require('../API/Permission');
import Server = require('../API/Server');
import nginx = require('../Common/Native/nginx');

export var NGINX_PERM_ARR = [Permission.Proxy];
export var NGINX_PERMISSION = PermissionLib.Encode(NGINX_PERM_ARR);

function ConnectionHandler(
    credential: { uid; pid; gid; },
    socket: net.Socket,
    callback: (handled: boolean) => any
    ) {
    trace("RPC Socket Scan (PROXY) ~ " + credential.pid);

    if (!NginxInstance || NginxInstance.IsChoking()
        || !NginxInstance.Process) {
        trace("NO MATCH, Moving on.. " + credential.pid);
        return callback(undefined);
    }

    //http://stackoverflow.com/questions/1525605/linux-programmatically-get-parent-pid-of-another-process
    /*
    I think the simplest thing would be to open "/proc" and parse the contents.
    You'll find the ppid as the 4th parameter of /proc/pid/stat
    */

    try {
        var content = fs.readFileSync("/proc/" + credential.pid + "/stat").toString();
        var ppid = Number(content.split(" ")[3].trim());
        if (ppid == NginxInstance.Process.pid) {
            trace("Proxy Socket Inbound " + credential.pid);
            PermissionLib.SetPermission(nginx_runtime_id, NGINX_PERMISSION);
            //Start serving STUFF
            Server.Serve(socket, CONF.SENDER_TYPE_PROXY, nginx_runtime_id,
                undefined);
            info("Proxy RPC is Bound with " + credential.pid);
        }
        else {
            trace("NO MATCH, Moving on.. " + credential.pid);
            callback(undefined);
        }
    } catch (e) {
        warn("Error fetching parent pid " + credential.pid);
        warn(e);
    }
}


var nginx_runtime_id;
export var NginxInstance: nginx.nginx;

export function Initialize(cb) {
    nginx_runtime_id = UUIDstr();
    NginxInstance = new nginx.nginx(NGINX_PERMISSION);
    NginxInstance.Ctrl.Init((err) => {
        cb(err);
        SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
            //Add this to the bottom, cause we are using ps command to filter out credentials
            //thus slows everything down :p
            Server.AddHandler(ConnectionHandler);
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