var Core = require("Core");
var nginx = Core.SubSys.Native.nginx;
SYS_ON(0 /* LOADED */, function () {
    var n = new nginx.nginx();
    n.Start();
    setTimeout(function () {
        n.Ctrl.MainServer._add("location", "/");
        n.Ctrl.MainServer["location"]._add("default_type", '"text/plain"');
        n.Ctrl.MainServer["location"]._add("content_by_lua", '"ngx.say(12345)"');
        n.Start();
    }, 5000);
});
