import nginx_conf = require("nginx-conf");
import Process = require("./Process");
import RPC = require("../../../Modules/RPC/index");
import API = require("../../API/_Export");
var nginxconf = nginx_conf.NginxConfFile;
import path = require("path");
import child_process = require("child_process");
import fs = require("fs");
import net = require("net");
import util = require("util");
import os = require("os");
import events = require("events");
import crypto = require("crypto");

export class CtrlInterface {

    public Config: nginx_conf.INginxConf;
    public Nginx: nginx_conf.INginxConfNode;
    public Events: nginx_conf.INginxConfNode;
    public Http: nginx_conf.INginxConfNode;
    //public InitLuaScript: nginx_conf.INginxConfNode;
    public APIPermissions: any[];
    public MainServer: nginx_conf.INginxConfNode;
    public WSServer: nginx_conf.INginxConfNode;
    public ProxyServer: nginx_conf.INginxConfNode;
    public ZPushServer: nginx_conf.INginxConfNode;

    private inited = false;

    Init = (cb) => {
        if (this.inited) return cb();
        nginxconf.createFromSource("", (err, n) => {
            if (err) return cb(err, undefined);
            this.Config = n;
            this.Nginx = this.Config.nginx;
            this.Nginx._add("daemon", "off");
            this.Nginx._add("worker_processes", 2);
            this.Nginx._add("pcre_jit", "off");
            this.Nginx._add("user", "nobody nogroup");
            //this._ngx._add("ssl_engine", "");
            this.Nginx._add("events");
            this.Events = this.Nginx["events"];
            this.Events._add("worker_connections", 1024);
            this.Events._add("use", "epoll");

            this.Nginx._add("http");
            this.Http = this.Nginx["http"];
            this.Http._add("include", "/etc/nginx/mime.types"); //to be changed
            this.Http._add("default_type", "application/octet-stream");
            this.Http._add("access_log", "off");
            this.Http._add("gzip", "off");
            this.Http._add("gzip_min_length", "1024");
            this.Http._add("gzip_comp_level", "3");
            this.Http._add("client_max_body_size", "10240m");
            this.Http._add("proxy_buffering", "off");
            this.Http._add("tcp_nopush", "on");
            this.Http._add("tcp_nodelay", "on");
            this.Http._add("proxy_set_header", "Accept-Encoding \"\"");
            this.Http._add("lua_package_cpath", "'/opt/luajit/?.so;'");
            this.Http._add("lua_package_path", '"' + path.join(CONF.MODULE_DIR, "Lua/?.lua") + ';"');
            this.Http._add("init_by_lua", this.GenerateStartupScript());
            //this.Http._add("init_by_lua", "'" + 'require("Nginx");' + "'");
            //this.InitLuaScript = this.Http["init_by_lua"];

            this.Http._add("server");
            this.Http._add("server");
            this.Http._add("server");

            this.MainServer = this.Http["server"][0];
            this.ZPushServer = this.Http["server"][1];
            this.ProxyServer = this.Http["server"][2];

            this.SetupServerNode(this.MainServer, 80, "localhost", "10240M");
            this.SetupServerNode(this.ZPushServer, 80, "wi-fi.exchange");
            this.SetupServerNode(this.ProxyServer, 3378, "localhost", "10240M");
            this.inited = true;
            cb();
        });

    };

    private GenerateStartupScript = () => {
        var _ngx_api = 'API = {};';
        var _ngx_permission = (this.APIPermissions);
        var _api = JSON.parse(RPC.APIManager.ToJSON((f, p) => {
            return API.Permission.Check(_ngx_permission, f["_p"]);
        }))["f"];
        Object.keys(_api).forEach((v, i, a) => { _ngx_api += 'API["' + v + '"]=' + _api[v] + ';'; });
        var _script =
            'API_Endpoint=' + '"unix:' + API.Server.GetAPIServer_SockPath() + '";'
            + _ngx_api + 'require("Init");';
        return "'" + _script + "'";
    };

    public SetupServerNode(serverNode: nginx_conf.INginxConfNode,
        port, name, client_max_body_size="4M") {

        if (serverNode["listen"] || serverNode._add("listen")) {
            serverNode["listen"]._value = port;
        }

        if (serverNode["server_name"] || serverNode._add("server_name")) {
            serverNode["server_name"]._value = name;
        }

        if (serverNode["client_max_body_size"] || serverNode._add("client_max_body_size")) {
            serverNode["client_max_body_size"]._value = client_max_body_size;
        }

    }

    ToConfig = () => {
        if (CONF.IS_DEBUG && CONF.SHOW_NGINX_CONF) {
            warn("\n" + this.Nginx._getString());
        }
        return this.Nginx._getString();
    };

}

//export class CtrlInterface {

//    daemon: boolean = false;

//    worker_process: number = 2;

//    pcre_jit: boolean = false;

//    ssl_engine: string = undefined;

//    user = "nobody nobody";

//    events = {
//        worker_connections: 1024,
//        use: "epoll"
//    };

//    http = {
//        include: ["mime.types"],
//        default_type: "application/octet-stream",
//        gzip: true,
//        gzip_min_length: 1024,
//        gzip_comp_level: 3,
//        proxy_set_header: "Accept-Encoding \"\"",
//        init_by_lua: "",
//        lua_package_path: "",
//        lua_package_cpath: "",
//    };



//    //http://stackoverflow.com/questions/9905378/nginx-subdomain-configuration
//}

export class nginx extends Process {

    public Ctrl: CtrlInterface = new CtrlInterface();

    private confPath = getSock(UUIDstr());

    private firstTime = true;

    constructor(APIPermissions?: any[]) {
        super("NGINX");
        this.Ctrl.APIPermissions = APIPermissions;
    }

    Start(forever: boolean = true) {
        if (this.firstTime) {
            return killall("nginx", (err, result) => {
                this.firstTime = false;
                this.Start(forever);
            });
        }
        if (!this.IsChoking()) {
            this.Ctrl.Init((err) => {
                if (err) {
                    error("Error Generating Nginx Conf");
                    error(err);
                } else {
                    var conf = this.Ctrl.ToConfig();
                    if (fs.existsSync(this.confPath)) {
                        fs.unlinkSync(this.confPath);
                    }
                    fs.writeFileSync(this.confPath, conf);
                    if (this.Process) {
                        trace("Reload!");
                        this.Process.kill("SIGHUP");
                    } else {
                        this.Process = child_process.spawn("nginx", [
                            "-c", this.confPath
                        ], {
                                env: {
                                    LD_LIBRARY_PATH: "/opt/luajit/lib"
                                }
                            });
                        super.Start(forever);
                    }
                }
            });
        }
    }

    OnChoke() {
        warn("Killing all NGINX processes");
        this.Process = undefined;
        killall("nginx", () => {
            info("Done, waiting for recall");
            this.Choke_Timer = setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 5000);
        });
        return true;
    }
}
