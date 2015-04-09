var HttpProxy = require("./HttpProxy");
var ProxyServer;
function Initialize(cb) {
    ProxyServer = HttpProxy.NginxInstance.Ctrl.ProxyServer;
    ProxyServer._add("location", "/");
    ProxyServer["location"]._add("default_type", "'text/plain'");
    var AnyPage = ProxyServer["location"];
    AnyPage._add("set", "$_target http://$http_host");
    AnyPage._add("resolver", "127.0.0.1");
    AnyPage._add("add_header", "X-Test 'EDGE'");
    AnyPage._add("proxy_pass", "$_target");
    cb();
}
exports.Initialize = Initialize;
