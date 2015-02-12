import Core = require("Core");
import Node = require("Node");
import nginx = Core.SubSys.Native.nginx;

SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
    var n = new nginx.nginx();
    n.Start();
    setTimeout(() => {
        n.Ctrl.MainServer._add("location", "/");
        n.Ctrl.MainServer["location"]._add("default_type", '"text/plain"');
        n.Ctrl.MainServer["location"]._add("content_by_lua", '"ngx.say(12345)"');
        n.Start();
    }, 5000);
});