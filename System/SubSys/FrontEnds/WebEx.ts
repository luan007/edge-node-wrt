import Node = require("Node");
import Core = require("Core");
import HttpProxy = require("./HttpProxy");
import url = require("url");
var ProxyServer;

export function Initialize(cb) {

    ProxyServer = HttpProxy.NginxInstance.Ctrl.ProxyServer;
    ProxyServer._add("location", "/");
    ProxyServer["location"]._add("default_type", "'text/plain'");
    var AnyPage = ProxyServer["location"];
    AnyPage._add("set", "$_target http://$http_host$uri$is_args$args");
    AnyPage._add("resolver", "127.0.0.1");
    AnyPage._add("add_header", "X-Test 'EDGE'");
    AnyPage._add("proxy_pass", "$_target");
    
    cb();
    //AnyPage._add("rewrite_by_lua", "'MainRewrite();'");
    //AnyPage._add("rewrite_by_lua", "'MainAuth()'");
    //AnyPage._add("access_by_lua", "'MainAccess()'");
    //AnyPage._add("proxy_cookie_path", "~.(.+) $_cookie_path/$1");
    //AnyPage._add("proxy_cookie_path", "~^\\Z $_cookie_path");
    //AnyPage._add("proxy_pass", "$_target$is_args$args");
    //AnyPage._add("header_filter_by_lua ", "'MainHeadFilter()'");
}
