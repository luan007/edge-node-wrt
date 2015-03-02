import Node = require("Node");
import Core = require("Core");
import HttpProxy = require("./HttpProxy");
import url = require("url");
import Abstract = Core.Lib.Abstract;

export class ServerConfig extends Abstract.Configurable {

    Instance: ServerConfig;

    Default = {
        RouterCookieId: ""
    };

    constructor() {
        super();
        this.Instance = this;
    }

    protected _apply = (mod, raw, cb: Callback) => {
        cb();
    };

    public Initialize = (cb) => {
        //not used
        this.Default.RouterCookieId = UUIDstr();
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Edge, "MainUI");
        this.Reload(this.Default, cb);
    };
}

var MainServer;

var conf = new ServerConfig();

var LauncherMainPort;
var LauncherAuthPort;

export function Initialize(cb) {

    conf.Initialize(() => {

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
        //AnyPage._add("rewrite_by_lua", "'MainRewrite();'");
        AnyPage._add("rewrite_by_lua", "'MainAuth()'");
        AnyPage._add("access_by_lua", "'MainAccess()'");
        //AnyPage._add("proxy_cookie_path", "~.(.+) $_cookie_path/$1");
        //AnyPage._add("proxy_cookie_path", "~^\\Z $_cookie_path");
        AnyPage._add("proxy_set_header", "edge_test 'OK'");
        AnyPage._add("proxy_set_header", "edge_dev $_dev");
        AnyPage._add("proxy_set_header", "edge_user $_user");
        AnyPage._add("proxy_set_header", "edge_host $host");
        AnyPage._add("proxy_pass", "$_target$is_args$args");
        AnyPage._add("header_filter_by_lua ", "'MainHeadFilter()'");

        cb();
    });
}

function GetTarget(Uri: string, authenticated: string, cb) {
    var base = "";
    var cookie_affect_range = "/" + UUIDstr() + "/"; //safe heaven :p
    var uri = Uri;
    trace(Uri);
    if (authenticated === "1") {
        //info(Uri);
        cookie_affect_range = "";
        base = LauncherMainPort;

        //TODO: Add more logic here :) 

    } else {
        //trace(Uri);
        base = LauncherAuthPort;
        cookie_affect_range = "";
    }
    base = "http://unix:/" + base + ":";
    var result = base + uri;
    //info(result);
    cb(undefined, [result, cookie_affect_range]);
}

function SetupLauncherPort(main, auth, cb) {
    var launcher = Core.App.RuntimePool.GetCallingRuntime(this);
    if (!launcher) return cb(new Error("Who are you?"));

    LauncherMainPort = Node.path.join(Core.SubSys.FileSystem.IsolatedZone.GetRealAppDataDir(launcher.App.uid), main);
    LauncherAuthPort = Node.path.join(Core.SubSys.FileSystem.IsolatedZone.GetRealAppDataDir(launcher.App.uid), auth);
    trace("Main:" + LauncherMainPort);
    trace("Auth:" + LauncherAuthPort);

    async.series([
        exec.bind(null, "chown", "nobody", LauncherMainPort),
        exec.bind(null, "chown", "nobody", LauncherAuthPort)
    ], (err) => {
        cb(err);
    });
}

__API(GetTarget, "Proxy.GetTarget", HttpProxy.NGINX_PERM_ARR);
__API(SetupLauncherPort, "Launcher.SetupPort", [Permission.Launcher]);

__API(function (atoken, cb) {
    if (!Core.User.UserManager.DB_Ticket[atoken]) {
        cb(new Error());
    } else {
        cb(undefined, Core.User.UserManager.DB_Ticket[atoken].owner_uid);
    }
}, "Proxy.AuthUser", HttpProxy.NGINX_PERM_ARR);

