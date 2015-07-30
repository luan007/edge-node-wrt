eval(LOG("Frontends:HttpProxy"));

import net = require('net');
import fs = require('fs');
import path = require('path');
import PermissionLib = require('../API/Permission');
import Server = require('../API/Server');
import nginx = require('../Common/Native/nginx');
import DeviceManager = require('../Device/DeviceManager');

function ConnectionHandler(credential:{ uid; pid; gid; },
                           socket:net.Socket,
                           callback:(handled:boolean) => any) {
    info("RPC Socket Scan (PROXY) ~ " + credential.pid);

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
            info("Proxy Socket Inbound " + credential.pid);
            PermissionLib.SetPermission(nginx_runtime_id, nginx.NGINX_PERMISSION);
            //Start serving STUFF
            Server.Serve(socket, CONF.SENDER_TYPE_PROXY, nginx_runtime_id,
                undefined);
            info("Proxy RPC is Bound with " + credential.pid);
            callback(true);
        }
        else {
            trace("NO MATCH, Moving on.. " + credential.pid);
            callback(undefined);
        }
    } catch (e) {
        fatal("Error fetching parent pid " + credential.pid);
        fatal(e);
        callback(true);
    }
}


var nginx_runtime_id;
export var NginxInstance:nginx.nginx;

export function Initialize(cb) {
    nginx_runtime_id = UUIDstr();
    NginxInstance = new nginx.nginx(nginx.NGINX_PERMISSION);

    SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
        //Add this to the bottom, cause we are using ps command to filter out credentials
        //thus slows everything down :p

        Server.AddHandler(ConnectionHandler);

        NginxInstance.Start(true);
    });

    return cb();
}

export function Diagnose(callback:Callback) {
    SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
        setTask('stability_check_http_proxy', ()=> {
            NginxInstance.StabilityCheck((err, stable)=> {
                if (err) return callback(err);
                return callback(null, stable);
            });
        }, 5000);
    });
}

__API((cb) => {
    cb(undefined, "=w= GOOD!");
}, "Proxy.SelfTest", nginx.NGINX_PERM_ARR);

import StatBiz = require('../Common/Stat/StatBiz');
import ConfMgr = require('../Common/Conf/ConfMgr');
export function GetDeviceByIp(_ip, cb) {
    var conn = ConfMgr.Get(SECTION.NETWORK);
    var routerip = conn.RouterIP;
    var netmask = conn.LocalNetmask;
    console.log(_ip, routerip, netmask);
    var subnet = ip.cidr_num(_ip, netmask);
    var oursub = ip.cidr_num(routerip, netmask);
    if (oursub !== subnet) {
        if(CONF.IS_DEBUG && CONF.BYPASS_ALL_AUTH){
            return cb(undefined, 0);
        }
        //unhappy :(
        cb(new Error("Outside current subnet"));
    } else {
        var mac = StatBiz.GetMacByIP(_ip);
        if (mac) {
            var deviceId = DeviceManager.GetDevIdByHWAddr(mac);
            cb(undefined, deviceId);
        } else {
            cb(new Error('device does not exist'));
        }
    }

}
__API(GetDeviceByIp, "Proxy.CurrentDevHeader", nginx.NGINX_PERM_ARR);
__API(GetDeviceByIp, "Network.GetDeviceByIp", [Permission.DeviceAccess, Permission.Network, Permission.Configuration]);