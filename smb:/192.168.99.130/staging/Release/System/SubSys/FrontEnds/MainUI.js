var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Node = require("Node");
var Core = require("Core");
var HttpProxy = require("./HttpProxy");
var Abstract = Core.Lib.Abstract;
var ServerConfig = (function (_super) {
    __extends(ServerConfig, _super);
    function ServerConfig() {
        var _this = this;
        _super.call(this);
        this.Default = {
            RouterCookieId: ""
        };
        this._apply = function (mod, raw, cb) {
            cb();
        };
        this.Initialize = function (cb) {
            _this.Default.RouterCookieId = UUIDstr();
            _this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Edge, "MainUI");
            _this.Reload(_this.Default, cb);
        };
        this.Instance = this;
    }
    return ServerConfig;
})(Abstract.Configurable);
exports.ServerConfig = ServerConfig;
var MainServer;
var conf = new ServerConfig();
var LauncherMainPort;
var LauncherAuthPort;
exports.PrefixTable = {};
exports.HostnameTable = {};
function Initialize(cb) {
    conf.Initialize(function () {
        MainServer = HttpProxy.NginxInstance.Ctrl.MainServer;
        MainServer._add("set", "$_auth ''");
        MainServer._add("set", "$_dev ''");
        MainServer._add("set", "$_user ''");
        MainServer._add("set", "$_target ''");
        MainServer._add("set", "$_siteid ''");
        MainServer._add("set", "$_cookie_path '/'");
        MainServer._add("location", "/");
        MainServer["location"]._add("default_type", "'text/plain'");
        var AnyPage = MainServer["location"];
        AnyPage._add("rewrite_by_lua", "'MainAuth()'");
        AnyPage._add("access_by_lua", "'MainAccess()'");
        AnyPage._add("proxy_set_header", "edge-test 'OK'");
        AnyPage._add("proxy_set_header", "x-forwarded-for $remote_addr");
        AnyPage._add("proxy_set_header", "x-real-ip $remote_addr");
        AnyPage._add("proxy_set_header", "edge-dev $_dev");
        AnyPage._add("proxy_set_header", "edge-user $_user");
        AnyPage._add("proxy_set_header", "edge-host $host");
        AnyPage._add("proxy_set_header", "Upgrade $http_upgrade");
        AnyPage._add("proxy_set_header", "Connection 'upgrade'");
        AnyPage._add("proxy_request_buffering", "off");
        AnyPage._add("proxy_http_version", "1.1");
        AnyPage._add("gzip", "off");
        AnyPage._add("proxy_pass", "$_target");
        AnyPage._add("header_filter_by_lua ", "'MainHeadFilter()'");
        cb();
    });
}
exports.Initialize = Initialize;
function GetTarget(host, Uri, authenticated, cb) {
    var base = "";
    var cookie_affect_range = "/" + UUIDstr() + "/";
    var uri = Uri;
    var host = host;
    var targetPrefix = "";
    var hostsplit = host.toLowerCase().split(".");
    if (authenticated === "1") {
        cookie_affect_range = "";
        base = LauncherMainPort;
        if (hostsplit.length === 3) {
            var h = hostsplit[0];
            for (var i in exports.HostnameTable) {
                var prefix = exports.HostnameTable[i][0].toLowerCase();
                if (h == prefix) {
                    base = exports.HostnameTable[i][1];
                    break;
                }
            }
        }
        else {
            var block1 = uri.split(/\?|\/|\#|\:/gmi)[1].toLowerCase();
            for (var i in exports.PrefixTable) {
                var prefix = exports.PrefixTable[i][0].toLowerCase();
                if (block1 == prefix) {
                    targetPrefix = prefix;
                    base = exports.PrefixTable[i][1];
                    break;
                }
            }
            uri = uri.substr(targetPrefix.length);
        }
    }
    else {
        trace(Uri);
        base = LauncherAuthPort;
        cookie_affect_range = "";
    }
    base = "http://unix:/" + base + ":";
    var result = base + uri;
    info(result);
    cb(undefined, [result, cookie_affect_range]);
}
function SetupLauncherPort(main, auth, cb) {
    var launcher = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!launcher)
        return cb(new Error("Who are you?"));
    LauncherMainPort = Node.path.join(Core.SubSys.FileSystem.IsolatedZone.GetRealAppDataDir(launcher.App.uid), main);
    LauncherAuthPort = Node.path.join(Core.SubSys.FileSystem.IsolatedZone.GetRealAppDataDir(launcher.App.uid), auth);
    trace("Main:" + LauncherMainPort);
    trace("Auth:" + LauncherAuthPort);
    async.series([
        exec.bind(null, "chown", "nobody", LauncherMainPort),
        exec.bind(null, "chown", "nobody", LauncherAuthPort)
    ], function (err) {
        cb(err);
    });
}
__API(GetTarget, "Proxy.GetTarget", HttpProxy.NGINX_PERM_ARR);
__API(SetupLauncherPort, "Launcher.SetupPort", [13 /* Launcher */]);
__API(function (atoken, cb) {
    if (!Core.User.UserManager.DB_Ticket[atoken]) {
        cb(new Error());
    }
    else {
        cb(undefined, Core.User.UserManager.DB_Ticket[atoken].owner_uid);
    }
}, "Proxy.AuthUser", HttpProxy.NGINX_PERM_ARR);
