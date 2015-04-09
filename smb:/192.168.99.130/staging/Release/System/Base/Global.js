require("./SystemEvent");
require("./Machine");
var os = require("os");
var arch = os.arch();
var _sys_conf = (function () {
    function _sys_conf() {
        this.LOADED = false;
        this.IS_DEBUG = true;
        this.ALWAYS_REBUILD_OUI = false;
        this.INTERACTIVE_DEBUG = true;
        this.IPTABLES_GUARD_LOG = false;
        this.DISABLE_SAMBA = true;
        this.IW_LOG = false;
        this.RPC_FUNC_LOG = true;
        this.SKIP_QUOTA_CHECK = false;
        this.CMD_DEBUG = true;
        this.ROOT_LEVEL_SECURITY = false;
        this.CODE_WRITE_LOCK = false;
        this.ENABLE_FULL_LOG = true;
        this.TIMER_LOG = false;
        this.TIMEOUT_LOG = false;
        this.ARP_TIMEOUT = 100000;
        this.BASE_PATH = path.join(__dirname, "../");
        this.SHADOW_BASE_PATH = "/SagittariusA/";
        this.SHADOW_DATA_PATH = path.join(this.SHADOW_BASE_PATH, "Data");
        this.DEV_STORAGE = "/dev/mmcblk0p1";
        this.BASE_DATA_PATH = "/Data/";
        this.USER_DATA_PATH = path.join("/User/");
        this.APP_BASE_PATH = path.join(this.BASE_PATH, "../Applications/");
        this.PLATFORM_BIAS_FS_SPLITTER = process.platform == "win32" ? "\\" : "/";
        this.DATA_DIR = process.env.DATA_DIR ? process.env.DATA_DIR : path.join(this.BASE_PATH, "../_data");
        this.MODULE_DIR = path.join(this.BASE_PATH, "../Modules");
        this.MAIN_SQL_PATH = path.join(this.DATA_DIR, "main.db");
        this.GRAPHD_LOCATION = path.join(this.BASE_PATH, "Device/Graphd/deltaV");
        this.GRAPHD_UPGRADE_LOCATION = path.join(this.BASE_PATH, "Device/Graphd");
        this.MAIN_REGISTRY_PATH = path.join(this.DATA_DIR, "reg");
        this.APP_TRUST_LIFE = 5;
        this.APP_SPAN_SCALER = 1.5;
        this.APP_RESP_SCAN_INTERVAL = 5000;
        this.AUTO_LOAD_APPS = false;
        this.ISO_DEFAULT_LIMIT = 1024 * 1500;
        this.DO_NOT_DETACH = true;
        this.ENABLE_EXEC_QUEUEING = true;
        this.PROCESS_DEBUG = false;
        this.BYPASS_APP_SIGCHECK = true;
        this.SHOW_NGINX_CONF = true;
        this.DEVICE_SAVE_INTERVAL = 30000;
        this.USERAUTH_PATROL_INTERVAL = 30000;
        this.MAX_DRIVERCHAIN_DEPTH = 30;
        this.DRV_MATCH_TIMEOUT = 1500;
        this.SENDER_TYPE_APP = "App";
        this.SENDER_TYPE_PROXY = "Proxy";
        this.BASE_FIREWALL = false;
        this.SSDP_PORT = 9979;
        this.SSDP_DEBUG = true;
        this.RELOAD_DEFAULT_CONFIG = true;
        this.BLUETOOTH_MAXLIFE = 300 * 1000;
        this.BLUETOOTH_SCAN_INTERVAL = 15 * 1000;
        this.BLUETOOTH_DROPWAIT = 30 * 1000;
        this.ENABLE_HTTPPROXY = false;
        this.CORE_PARTS = {
            LAUNCHER: "Launcher"
        };
        this.DEV = {
            WLAN: {
                DEV_2G: "ap1",
                DEV_5G: "ap0"
            },
            BLUETOOTH: {
                DEV_HCI: "hci0",
                DEV_AUD: "hci1"
            },
            ETH: {
                DEV_WAN: "eth2"
            }
        };
        this.BUS = {
            ap0: "WLAN",
            ap1: "WLAN",
            hci0: "BLUETOOTH",
            hci1: "BLUETOOTH",
        };
        this.ORBIT = {
            HOST: "192.168.31.154",
            PORT: 8080,
            DEFAULT_TIMEOUT: 20000
        };
        this.USER_IMMEDIATE_EXPIRE = false;
        this.IPTABLES_6 = false;
    }
    return _sys_conf;
})();
var CONF = new _sys_conf();
global.CONF = CONF;
if (arch !== "arm") {
    CONF.ORBIT.HOST = "127.0.0.1";
    CONF.DEV_STORAGE = "/dev/sda1";
}
var SYS_EVENT_TYPE;
(function (SYS_EVENT_TYPE) {
    SYS_EVENT_TYPE[SYS_EVENT_TYPE["LOADED"] = 0] = "LOADED";
    SYS_EVENT_TYPE[SYS_EVENT_TYPE["ERROR"] = 1] = "ERROR";
})(SYS_EVENT_TYPE || (SYS_EVENT_TYPE = {}));
console.log(CONF);
global.SYS_EVENT_TYPE = SYS_EVENT_TYPE;
