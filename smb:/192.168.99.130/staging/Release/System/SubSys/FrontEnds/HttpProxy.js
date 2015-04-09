var Node = require("Node");
var Core = require("Core");
exports.NGINX_PERM_ARR = [1 /* Proxy */];
exports.NGINX_PERMISSION = Core.API.Permission.Encode(exports.NGINX_PERM_ARR);
function ConnectionHandler(credential, socket, callback) {
    trace("RPC Socket Scan (PROXY) ~ " + credential.pid);
    if (!exports.NginxInstance || exports.NginxInstance.IsChoking() || !exports.NginxInstance.Process) {
        trace("NO MATCH, Moving on.. " + credential.pid);
        return callback(undefined);
    }
    try {
        var content = Node.fs.readFileSync("/proc/" + credential.pid + "/stat").toString();
        var ppid = Number(content.split(" ")[3].trim());
        if (ppid == exports.NginxInstance.Process.pid) {
            trace("Proxy Socket Inbound " + credential.pid);
            Core.API.Permission.SetPermission(nginx_runtime_id, exports.NGINX_PERMISSION);
            Core.API.Server.Serve(socket, CONF.SENDER_TYPE_PROXY, nginx_runtime_id, undefined);
            info("Proxy RPC is Bound with " + credential.pid);
        }
        else {
            trace("NO MATCH, Moving on.. " + credential.pid);
            callback(undefined);
        }
    }
    catch (e) {
        warn("Error fetching parent pid " + credential.pid);
        warn(e);
    }
}
var nginx_runtime_id;
exports.NginxInstance;
function Initialize(cb) {
    nginx_runtime_id = UUIDstr();
    exports.NginxInstance = new Core.SubSys.Native.nginx.nginx(exports.NGINX_PERMISSION);
    exports.NginxInstance.Ctrl.Init(function (err) {
        cb(err);
        SYS_ON(0 /* LOADED */, function () {
            Core.API.Server.AddHandler(ConnectionHandler);
            async.series([
                require("./MainUI").Initialize,
                require("./WebEx").Initialize
            ], function () {
                exports.NginxInstance.Start(true);
            });
        });
    });
}
exports.Initialize = Initialize;
__API(function (cb) {
    cb(undefined, "=w= GOOD!");
}, "Proxy.SelfTest", exports.NGINX_PERM_ARR);
