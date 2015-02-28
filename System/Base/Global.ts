declare var path;
class _sys_conf {
    LOADED = false; // don't touch
    IS_DEBUG = true; 
    INTERACTIVE_DEBUG = true; 
    RPC_FUNC_LOG = true; 
    SKIP_QUOTA_CHECK = false; // = true if your boot is too slow, however Runtime.ts will be unstable
    CMD_DEBUG = false; // turn this on if you want to see iptables, chmod, chroot and such being printed
    ROOT_LEVEL_SECURITY = false; // = true will lead to a recursive chmod 0005 on '/', be warned - NOT TESTED
    CODE_WRITE_LOCK = false; // = true for production (MUST)
    ENABLE_FULL_LOG = true; // main switch for trace/info .. methods
    TIMER_LOG = false; //enable this to see all active timers (setInterval)
    TIMEOUT_LOG = false; //enable this to see all setTimeout calls
    ARP_TIMEOUT = 100000; //ARP Cache timeout, ARP-Rescan can be slow (worst case = ping)
    BASE_PATH = path.join(__dirname, "../"); 
    SHADOW_BASE_PATH = "/SagittariusA/"
    SHADOW_DATA_PATH = path.join(this.SHADOW_BASE_PATH, "/Data/");
    DEV_STORAGE = "/dev/sda1"; // system partition, as for onboard-emmc configuration: /dev/mmcblk0p1
    BASE_DATA_PATH = "/Data/";
    USER_DATA_PATH = path.join(this.BASE_DATA_PATH, "User/");
    APP_BASE_PATH = path.join(this.BASE_PATH, "../Applications/");
    PLATFORM_BIAS_FS_SPLITTER = process.platform == "win32" ? "\\" : "/";
    DATA_DIR = process.env.DATA_DIR ? process.env.DATA_DIR : path.join(this.BASE_PATH, "../_data");
    MODULE_DIR = path.join(this.BASE_PATH, "../Modules");
    MAIN_SQL_PATH = path.join(this.DATA_DIR, "main.db");
    GRAPHD_LOCATION = path.join(this.BASE_PATH, "Device/Graphd/deltaV");
    GRAPHD_UPGRADE_LOCATION = path.join(this.BASE_PATH, "Device/Graphd");
    MAIN_REGISTRY_PATH = path.join(this.DATA_DIR, "reg");
    APP_TRUST_LIFE = 5; 
    APP_SPAN_SCALER = 1.5; // Max = 10 ^ 1.5 = 316sec
    APP_RESP_SCAN_INTERVAL = 5000; // Max = 10 ^ 2.5 = 316sec
    AUTO_LOAD_APPS = false;
    ISO_DEFAULT_LIMIT = 1024 * 1500; //1500MB
    DO_NOT_DETACH = true; 
    ENABLE_EXEC_QUEUEING = true;
    PROCESS_DEBUG = false;
    BYPASS_APP_SIGCHECK = true;
    SHOW_NGINX_CONF = false;
    DEVICE_SAVE_INTERVAL = 30000;
    USERAUTH_PATROL_INTERVAL = 30000;
    MAX_DRIVERCHAIN_DEPTH = 30;
    DRV_MATCH_TIMEOUT = 1500;
    SENDER_TYPE_APP = "App";
    SENDER_TYPE_PROXY = "Proxy";
    RELOAD_DEFAULT_CONFIG = true; //Turn this on to restore sys's default config (as for Configurable.ts and its children)
    CORE_PARTS = {
        LAUNCHER: "Launcher"
    };
    DEV = {
        WLAN: {
            DEV_2G: "wlan0",
            DEV_5G: "wlan1"
        },
        ETH: {
            DEV_WAN: "eth0"
        }
    };
    BUS = { //DEV Reverse
        wlan0: "WLAN",
        wlan1: "WLAN"
    };
    ORBIT = {
        HOST: "127.0.0.1",
        PORT: 8080,
        DEFAULT_TIMEOUT: 20000
    };
    USER_IMMEDIATE_EXPIRE = false;
}


var CONF = new _sys_conf();
global.CONF = CONF;

enum SYS_EVENT_TYPE {
    LOADED,
    ERROR,
}

global.SYS_EVENT_TYPE = SYS_EVENT_TYPE;