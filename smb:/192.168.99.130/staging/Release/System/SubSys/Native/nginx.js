var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var nginx_conf = require("nginx-conf");
var Core = require("Core");
var Node = require("Node");
var Process = require("./Process");
var nginxconf = nginx_conf.NginxConfFile;
var CtrlInterface = (function () {
    function CtrlInterface() {
        var _this = this;
        this.inited = false;
        this.Init = function (cb) {
            if (_this.inited)
                return cb();
            nginxconf.createFromSource("", function (err, n) {
                if (err)
                    return cb(err, undefined);
                _this.Config = n;
                _this.Nginx = _this.Config.nginx;
                _this.Nginx._add("daemon", "off");
                _this.Nginx._add("worker_processes", 2);
                _this.Nginx._add("pcre_jit", "off");
                _this.Nginx._add("user", "nobody nogroup");
                _this.Nginx._add("events");
                _this.Events = _this.Nginx["events"];
                _this.Events._add("worker_connections", 1024);
                _this.Events._add("use", "epoll");
                _this.Nginx._add("http");
                _this.Http = _this.Nginx["http"];
                _this.Http._add("include", "/etc/nginx/mime.types");
                _this.Http._add("default_type", "application/octet-stream");
                _this.Http._add("access_log", "off");
                _this.Http._add("gzip", "off");
                _this.Http._add("gzip_min_length", "1024");
                _this.Http._add("gzip_comp_level", "3");
                _this.Http._add("client_max_body_size", "10240m");
                _this.Http._add("proxy_buffering", "off");
                _this.Http._add("tcp_nopush", "on");
                _this.Http._add("tcp_nodelay", "on");
                _this.Http._add("proxy_set_header", "Accept-Encoding \"\"");
                _this.Http._add("lua_package_cpath", "'/opt/luajit/?.so;'");
                _this.Http._add("lua_package_path", '"' + Node.path.join(CONF.MODULE_DIR, "Lua/?.lua") + ';"');
                _this.Http._add("init_by_lua", _this.GenerateStartupScript());
                _this.Http._add("server");
                _this.Http._add("server");
                _this.Http._add("server");
                _this.MainServer = _this.Http["server"][0];
                _this.ZPushServer = _this.Http["server"][1];
                _this.ProxyServer = _this.Http["server"][2];
                _this.SetupServerNode(_this.MainServer, 80, "localhost", "10240M");
                _this.SetupServerNode(_this.ZPushServer, 80, "wi-fi.exchange");
                _this.SetupServerNode(_this.ProxyServer, 3378, "localhost", "10240M");
                _this.inited = true;
                cb();
            });
        };
        this.GenerateStartupScript = function () {
            var _ngx_api = 'API = {};';
            var _ngx_permission = (_this.APIPermissions);
            var _api = JSON.parse(Core.RPC.APIManager.ToJSON(function (f, p) {
                return Core.API.Permission.Check(_ngx_permission, f["_p"]);
            }))["f"];
            Object.keys(_api).forEach(function (v, i, a) {
                _ngx_api += 'API["' + v + '"]=' + _api[v] + ';';
            });
            var _script = 'API_Endpoint=' + '"unix:' + Core.API.Server.GetAPIServer_SockPath() + '";' + _ngx_api + 'require("Init");';
            return "'" + _script + "'";
        };
        this.ToConfig = function () {
            if (CONF.IS_DEBUG && CONF.SHOW_NGINX_CONF) {
                warn("\n" + _this.Nginx._getString());
            }
            return _this.Nginx._getString();
        };
    }
    CtrlInterface.prototype.SetupServerNode = function (serverNode, port, name, client_max_body_size) {
        if (client_max_body_size === void 0) { client_max_body_size = "4M"; }
        if (serverNode["listen"] || serverNode._add("listen")) {
            serverNode["listen"]._value = port;
        }
        if (serverNode["server_name"] || serverNode._add("server_name")) {
            serverNode["server_name"]._value = name;
        }
        if (serverNode["client_max_body_size"] || serverNode._add("client_max_body_size")) {
            serverNode["client_max_body_size"]._value = client_max_body_size;
        }
    };
    return CtrlInterface;
})();
exports.CtrlInterface = CtrlInterface;
var nginx = (function (_super) {
    __extends(nginx, _super);
    function nginx(APIPermissions) {
        _super.call(this, "NGINX");
        this.Ctrl = new CtrlInterface();
        this.confPath = getSock(UUIDstr());
        this.firstTime = true;
        this.Ctrl.APIPermissions = APIPermissions;
    }
    nginx.prototype.Start = function (forever) {
        var _this = this;
        if (forever === void 0) { forever = true; }
        if (this.firstTime) {
            return killall("nginx", function (err, result) {
                _this.firstTime = false;
                _this.Start(forever);
            });
        }
        if (!this.IsChoking()) {
            this.Ctrl.Init(function (err) {
                if (err) {
                    error("Error Generating Nginx Conf");
                    error(err);
                }
                else {
                    var conf = _this.Ctrl.ToConfig();
                    if (Node.fs.existsSync(_this.confPath)) {
                        Node.fs.unlinkSync(_this.confPath);
                    }
                    Node.fs.writeFileSync(_this.confPath, conf);
                    if (_this.Process) {
                        trace("Reload!");
                        _this.Process.kill("SIGHUP");
                    }
                    else {
                        _this.Process = Node.child_process.spawn("nginx", [
                            "-c",
                            _this.confPath
                        ], {
                            env: {
                                LD_LIBRARY_PATH: "/opt/luajit/lib"
                            }
                        });
                        _super.prototype.Start.call(_this, forever);
                    }
                }
            });
        }
    };
    nginx.prototype.OnChoke = function () {
        var _this = this;
        warn("Killing all NGINX processes");
        this.Process = undefined;
        killall("nginx", function () {
            info("Done, waiting for recall");
            _this.Choke_Timer = setTimeout(function () {
                _this.ClearChoke();
                _this.Start();
            }, 5000);
        });
        return true;
    };
    return nginx;
})(Process);
exports.nginx = nginx;
