//import HttpProxy = require("./HttpProxy");
//import url = require("url");
//import Registry =  require('../DB/Registry');
//import ConfMgr = require('../Common/Conf/ConfMgr');
//import _Config = require('../Common/Conf/Config');
//import Config = _Config.Config;
//import _Configurable = require('../Common/Conf/Configurable');
//import Configurable = _Configurable.Configurable;
//import AppManager = require('../APP/AppManager');
//import RuntimePool = require('../APP/RuntimePool');
//import UserManager = require('../User/UserManager');
//
//export class ServerConfig extends Configurable {
//
//    Instance: ServerConfig;
//
//    constructor(moduleName:string, defaultConfig:any) {
//        super(moduleName, defaultConfig);
//
//        this.Instance = this;
//    }
//
//    protected _apply = (mod, raw, cb: Callback) => {
//        cb();
//    };
//}
//
//var MainServer;
//
//var LauncherMainPort;
//var LauncherAuthPort;
//
//export var PrefixTable = {
//    //owner_id: [ prefix, dest ]
//};
//export var HostnameTable = {
//    //owner_id: [ prefix, dest ]
//};
//
//var defaultConfig = {
//    RouterCookieId: UUIDstr()
//};
//
//export function Initialize(cb) {
//
//    var conf = new ServerConfig(SECTION.MAINUI, defaultConfig);
//
//    conf.Initialize(() => {
//
//        MainServer = HttpProxy.NginxInstance.Ctrl.MainServer;
//        MainServer._add("set", "$_auth ''");
//        MainServer._add("set", "$_dev ''");
//        MainServer._add("set", "$_user ''");
//        MainServer._add("set", "$_target ''");
//        MainServer._add("set", "$_siteid ''");
//        MainServer._add("set", "$_cookie_path '/'");
//        MainServer._add("location", "/");
//        MainServer["location"]._add("default_type", "'text/plain'");
//        var AnyPage = MainServer["location"];
//        //AnyPage._add("rewrite_by_lua", "'MainRewrite();'");
//        AnyPage._add("rewrite_by_lua", "'MainAuth()'");
//        AnyPage._add("access_by_lua", "'MainAccess()'");
//        //AnyPage._add("proxy_cookie_path", "~.(.+) $_cookie_path/$1");
//        //AnyPage._add("proxy_cookie_path", "~^\\Z $_cookie_path");
//        AnyPage._add("proxy_set_header", "edge-test 'OK'");
//        AnyPage._add("proxy_set_header", "x-forwarded-for $remote_addr");
//        AnyPage._add("proxy_set_header", "x-real-ip $remote_addr");
//        AnyPage._add("proxy_set_header", "edge-dev $_dev");
//        AnyPage._add("proxy_set_header", "edge-user $_user");
//        AnyPage._add("proxy_set_header", "edge-host $host");
//        AnyPage._add("proxy_set_header", "Upgrade $http_upgrade");
//        AnyPage._add("proxy_set_header", "Connection 'upgrade'");
//        AnyPage._add("proxy_request_buffering", "off");
//        AnyPage._add("proxy_http_version", "1.1");
//        AnyPage._add("gzip", "off");
//
//        AnyPage._add("proxy_pass", "$_target");
//        AnyPage._add("header_filter_by_lua ", "'MainHeadFilter()'");
//
//        cb();
//    });
//}
//
//function GetTarget(host: string, Uri: string, authenticated: string, cb) {
//    var base = "";
//    var cookie_affect_range = "/" + UUIDstr() + "/"; //safe heaven :p
//    var uri = Uri;
//    var host = host;
//    var targetPrefix = "";
//    //trace(host + " :: " + Uri);
//
//    var hostsplit = host.toLowerCase().split(".");
//
//    if (authenticated === "1") {
//
//        cookie_affect_range = "";
//        base = LauncherMainPort;
//
//        if (hostsplit.length === 3) {
//            var h = hostsplit[0];
//            for (var i in HostnameTable) {
//                var prefix = HostnameTable[i][0].toLowerCase();
//                if (h == prefix) {
//                    base = HostnameTable[i][1];
//                    break;
//                }
//            }
//        } else {
//            var block1 = uri.split(/\?|\/|\#|\:/gmi)[1].toLowerCase();
//            for (var i in PrefixTable) {
//                var prefix = PrefixTable[i][0].toLowerCase();
//                if (block1 == prefix) {
//                    targetPrefix = prefix;
//                    base = PrefixTable[i][1];
//                    break;
//                }
//            }
//            uri = uri.substr(targetPrefix.length);
//        }
//        //TODO: Add more logic here :)
//    } else {
//        trace(Uri);
//        base = LauncherAuthPort;
//        cookie_affect_range = "";
//    }
//    base = "http://unix:/" + base + ":";
//    var result = base + uri;
//    info(result);
//    cb(undefined, [result, cookie_affect_range]);
//}
//
//function SetupLauncherPort(main, auth, cb) {
//    var launcher = RuntimePool.GetCallingRuntime(this);
//    if (!launcher) return cb(new Error("Who are you?"));
//
//    LauncherMainPort = path.join(AppManager.GetRealAppDataDir(launcher.App.uid), main);
//    LauncherAuthPort = path.join(AppManager.GetRealAppDataDir(launcher.App.uid), auth);
//    trace("Main:" + LauncherMainPort);
//    trace("Auth:" + LauncherAuthPort);
//
//    async.series([
//        exec.bind(null, "chown", "nobody", LauncherMainPort),
//        exec.bind(null, "chown", "nobody", LauncherAuthPort)
//    ], (err) => {
//        cb(err);
//    });
//}
//
//__API(GetTarget, "Proxy.GetTarget", HttpProxy.NGINX_PERM_ARR);
//__API(SetupLauncherPort, "Launcher.SetupPort", [Permission.Launcher]);
//
//__API(function (atoken, cb) {
//    if (!UserManager.DB_Ticket[atoken]) {
//        cb(new Error());
//    } else {
//        cb(undefined, UserManager.DB_Ticket[atoken].owner_uid);
//    }
//}, "Proxy.AuthUser", HttpProxy.NGINX_PERM_ARR);