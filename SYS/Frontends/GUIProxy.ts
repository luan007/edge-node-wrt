import net = require('net');
import fs = require('fs');
import path = require('path');
import Server = require('../API/Server');
import DeviceManager = require('../Device/DeviceManager');
import PermissionLib = require('../API/Permission');

export var GUI_PERMISSION_ARR = [Permission.System];
export var GUI_PERMISSION = PermissionLib.Encode(GUI_PERMISSION_ARR);


function ConnectionHandler(credential:{ uid; pid; gid; },
                           socket:net.Socket,
                           callback:(handled:boolean) => any) {
    info("RPC Socket Scan (GUI PROXY) ~ " + credential.pid);

    // if (!GUIInstance || GUIInstance.IsChoking()
    //     || !GUIInstance.Process) {
    //     fatal("NO MATCH, Moving on.. " + credential.pid);
    //     return callback(undefined);
    // }

    //http://stackoverflow.com/questions/1525605/linux-programmatically-get-parent-pid-of-another-process
    /*
     I think the simplest thing would be to open "/proc" and parse the contents.
     You'll find the ppid as the 4th parameter of /proc/pid/stat
     */

    try {
        if(!fs.existsSync("/var/GUI")) return callback(undefined);
        var pid = fs.readFileSync("/var/GUI").toString();
        if (pid == credential.pid) {
            info("GUI Proxy Socket Inbound " + credential.pid);
            PermissionLib.SetPermission(gui_runtime_id, GUI_PERMISSION);
            //Start serving STUFF
            Server.Serve(socket, CONF.SENDER_TYPE_GUI, gui_runtime_id, 
                gui_runtime_id);
            info("GUI Proxy RPC is Bound with " + credential.pid);
        }
        else {
            trace("NO MATCH, Moving on.. " + credential.pid);
            callback(undefined);
        }
    } catch (e) {
        fatal("Error fetching parent pid " + credential.pid);
        fatal(e);
    }
}

var gui_runtime_id;
export function Initialize(cb) {
    gui_runtime_id = UUIDstr();
    Server.AddHandler(ConnectionHandler);
    //GUIInstance.Start(true);
    return cb();
}