var os = require("os");
var arch = os.arch();
var path = require('path');

class _sys_global_conf {
    LOADED = false; // don't touch
    IS_DEBUG = true;
    ALWAYS_REBUILD_OUI = false;
    INTERACTIVE_DEBUG = true;
    IPTABLES_GUARD_LOG = false;
    DISABLE_SAMBA = false;
    IW_LOG = false;
    RPC_FUNC_LOG = true;
    SKIP_QUOTA_CHECK = false; // = true if your boot is too slow, however Runtime.ts will be unstable
    CMD_DEBUG = true; // turn this on if you want to see iptables, chmod, chroot and such being printed
    ROOT_LEVEL_SECURITY = false; // = true will lead to a recursive chmod 0005 on '/', be warned - NOT TESTED
    CODE_WRITE_LOCK = false; // = true for production (MUST)
    ENABLE_FULL_LOG = true; // main switch for trace/info .. methods
    TIMER_LOG = false; //enable this to see all active timers (setInterval)
    TIMEOUT_LOG = false; //enable this to see all setTimeout calls
    ARP_TIMEOUT = 100000; //ARP Cache timeout, ARP-Rescan can be slow (worst case = ping)
    BASE_PATH = process.env.ROOT_PATH;
    SHADOW_BASE_PATH = "/SagittariusA/"
    SHADOW_DATA_PATH = path.join(this.SHADOW_BASE_PATH, "Data");
    DEV_STORAGE = "/dev/mmcblk0p1"; // system partition, as for onboard-emmc configuration: /dev/mmcblk0p1
    BASE_DATA_PATH = "/Data/";
    USER_DATA_PATH = path.join("/User/");
    PLATFORM_BIAS_FS_SPLITTER = process.platform == "win32" ? "\\" : "/";
    DATA_DIR = process.env.DATA_DIR ? process.env.DATA_DIR : path.join(this.BASE_PATH, "../_data");
    MODULE_DIR = path.join(this.BASE_PATH, "../Modules");
    MAIN_SQL_PATH = <any>'/var/main.db';
    GRAPHD_LOCATION = path.join(this.BASE_PATH, "Device/Graphd/deltaV");
    GRAPHD_UPGRADE_LOCATION = path.join(this.BASE_PATH, "Device/Graphd");
    GRAPHD_CLASSES_LOCATION = path.join(this.GRAPHD_UPGRADE_LOCATION, "graphd.classes.json");
    GRAPHD_ATTRIBUTES_LOCATION = path.join(this.GRAPHD_UPGRADE_LOCATION, "graphd.attributes.json");
    GRAPHD_ACTIONS_LOCATION = path.join(this.GRAPHD_UPGRADE_LOCATION, "graphd.actions.json");
    GRAPHD_PASSWORD_FILE = path.join(this.GRAPHD_UPGRADE_LOCATION, "graphd.password");
    GRAPHD_CHECK_INTERVAL = 1 * 60 * 1000;
    MAIN_REGISTRY_PATH = path.join(this.DATA_DIR, "reg");
    APP_TRUST_LIFE = 5;
    APP_SPAN_SCALER = 2.6; // Max = 10 ^ 1.5 = 316sec
    APP_RESP_SCAN_INTERVAL = 5000; // Max = 10 ^ 2.5 = 316sec
    AUTO_LOAD_APPS = true;
    ISO_DEFAULT_LIMIT = 1024 * 1500; //1500MB
    DO_NOT_DETACH = true;
    ENABLE_EXEC_QUEUEING = true;
    PROCESS_DEBUG = false;
    BYPASS_APP_SIGCHECK = true;
    SHOW_NGINX_CONF = true;
    
    BYPASS_ALL_AUTH = true; //THIS SHOULD ****NOT**** BE TRUE! UNLESS YOU KNOW WHAT YOUUUU ARE DOING
    
    DEVICE_SAVE_INTERVAL = 30000;
    USERAUTH_PATROL_INTERVAL = 30000;
    DEVICE_SYNC_INTERVAL = 20 * 60 * 1000;
    MAX_DRIVERCHAIN_DEPTH = 30;
    DRV_MATCH_TIMEOUT = 10000;
    PIN_TICKET_EXPIRE = 5 * 60 * 60 * 1000;
    PIN_TOKEN_EXPIRE = 72 * 60 * 60 * 1000;
    SENDER_TYPE_APP = "App";
    SENDER_TYPE_PROXY = "Proxy";
    SENDER_TYPE_GUI = "GUI";
    BASE_FIREWALL = false;
    SSDP_DEBUG = true;
    RELOAD_DEFAULT_CONFIG = true; //Turn this on to restore sys's default config (as for Configurable.ts and its children)
    BLUETOOTH_MAXLIFE = 300 * 1000; //300 sec
    BLUETOOTH_SCAN_INTERVAL = 15 * 1000; //15 sec
    BLUETOOTH_DROPWAIT = 30 * 1000; //30 sec till dead
    ENABLE_HTTPPROXY = false;
    CONFIG_DELAY = 100; //delay 100ms before write to disk
    CONFIG_PATH = '/var/';
    CORE_PARTS = {
        LAUNCHER: "Launcher"
    };
    DEV = {
        WLAN: {
            DEV_2G: process.env.DEV_2G || "ap1",
            DEV_5G: process.env.DEV_5G || "ap0",
            WLAN_BR: process.env.WLAN_BR || "br0",
            DEV_GUEST_2G: process.env.DEV_GUEST_2G || "guest0",
            DEV_GUEST_5G: process.env.DEV_GUEST_5G || "guest1"
        },
        BLUETOOTH: {
            DEV_HCI: "hci0",
            DEV_AUD: "hci1"
        },
        ETH: {
            DEV_WAN: process.env.DEV_WAN || "eth2"
        }
    };
    BUS = { //DEV Reverse
        ap0: "WLAN",
        ap1: "WLAN",
        hci0: "BLUETOOTH",
        hci1: "BLUETOOTH",
    };
    ORBIT = {
        HOST: "139.162.6.35", //for test onboard
        PORT: 8080,
        DEFAULT_TIMEOUT: 20000
    };
    USER_IMMEDIATE_EXPIRE = false;
    IPTABLES_6 = false;
    IPTABLES_TRAFFIC_INTERVAL = 5 * 1000;   // iptables traffic patrol sleep interval
    IPTABLES_TRAFFIC_SAVE_INTERVAL = 30 * 1000;
    IW_STATION_DUMP_INTERVAL = 10 * 1000;
    LOG_LEVELS = []; // 'error', 'fatal'
    LOG_TO_FILE = true;
    ON_BOARD = true; //on-board
    LUA_NGINX_SOCKET = '/var/lua_nginx_socket';
    
    //Storage
    STORAGE_DISK_DIR = process.env.storage || '/storage/';
    KEY_STORE_DIR = path.join(this.STORAGE_DISK_DIR, 'Keys');
    APP_PRV_KEY = path.join(this.KEY_STORE_DIR, 'App.pr');
    ROUTER_PUB_KEY = path.join(this.KEY_STORE_DIR, 'Router.pb');
    PKG_INIT_FILE = path.join(this.STORAGE_DISK_DIR, 'init.zip');
    PKG_LATEST_FILE = path.join(this.STORAGE_DISK_DIR, 'latest.zip');
    PKG_PASSWORD_DIR = path.join(this.STORAGE_DISK_DIR, 'passwords');
    PKG_INIT_PASSWORD_FILE = path.join(this.PKG_PASSWORD_DIR, 'init_password');
    PKG_LATEST_PASSWORD_FILE = path.join(this.PKG_PASSWORD_DIR, 'pkg_latest_password');
    
    APP_BASE_PATH = path.join(this.STORAGE_DISK_DIR, "Apps");

    RESOURCE_STORE_DIR = path.join(this.STORAGE_DISK_DIR, 'Resource');
    STREAMING_STORE_DIR = path.join(this.RESOURCE_STORE_DIR, 'Streaming'); //clear often.
    AIRPLAY_STORE_DIR = path.join(this.STREAMING_STORE_DIR, 'Airplay'); //clear often.
    AVATAR_PATH = path.join(this.RESOURCE_STORE_DIR, "Avatar");
    SYMBOL_PATH = path.join(this.RESOURCE_STORE_DIR, "Symbol");

    //ramdisk
    RAM_DISK_DIR = process.env.ramdisk || '/ramdisk/';
    DIAGNOSTIC_FILE = path.join(this.RAM_DISK_DIR, 'diagnostic');
    APP_TMP_DIR = path.join(this.RAM_DISK_DIR, 'app_tmp');
    APP_PID_FILE = path.join(this.RAM_DISK_DIR, 'app_pid');
    PKG_UPGRADE_FILE = path.join(this.RAM_DISK_DIR, 'pkg_upgrade');
    PKG_TMP_DIR = path.join(this.RAM_DISK_DIR, 'pkg_tmp');
    PKG_FAIL_FILE = path.join(this.RAM_DISK_DIR, 'pkg_fail');
    PKG_UPGRADE_PASSWORD_FILE = path.join(this.RAM_DISK_DIR, 'pkg_upgrade_password');

    TMP_DIR = "/tmp";

    //token
    TOKEN_PATROL_INTERVAL = 0.5 * 60 * 1000;
    TOKEN_EXPIRE_SECONDS = 2 * 1000;

    //connectivity
    CONNECTIVITY_CHECK_INTERVAL = 60 * 1000;     // ping check interval
    CONNECTIVITY_CHECK_WAIT_SECONDS = 5;        // ping check timeout (in seconds)
    CONNECTIVITY_CHECK_DOMAINS =
        ["www.baidu.com", "www.qq.com", "www.weibo.com", "www.taobao.com", "www.jd.com"];


    //port ranges
    PORTS = {
        SSDP: 9979,
        AIRPLAY_RANGE_MIN: 37000,
        AIRPLAY_RANGE_MAX: 37500
    }
}

class _global_section {
    NETWORK = 'NETWORK';
    WLAN5G = 'WLAN5G';
    WLAN2G = 'WLAN2G';
    BLUETOOTH = 'BLUETOOTH';
    FIREWALL = "FIREWALL";
    TRAFFIC = "TRAFFIC";
    STREAMING = 'STREAMING';
    DEVICE = 'DEVICE';
    USER = 'USER';
    SAMBA = 'SAMBA';
    OBEX = 'OBEX';
    RUNTIME = 'RUNTIME';
    APP = "APP";
    PKG = "PKG";
    GRAPHD = "GRAPHD";
    CONNECTIVITY = "CONNECTIVITY";
    BTLE = "BTLE";
    LOADER = "LOADER";
}

var CONF = new _sys_global_conf();
global.CONF = CONF;

var SECTION = new _global_section();
global.SECTION = SECTION;


if (arch !== "arm") {
    CONF.ORBIT.HOST = "127.0.0.1";
    CONF.DEV_STORAGE = "/dev/sda1";
}

console.log(CONF);

class _global_mac_conf {
    ROUTERID = process.env.ROUTERID || "TEST_ROUTER_0";
    ModelName = "Edge Dev";
    ModelNumber = " _D_E_V_ ";
    Serial = "______";
    Major = "0";
    Minor = "0";
    ModelUrl = "http://edge.network";
    DefaultUrl = "http://wifi.network";
}

var MACHINE = new _global_mac_conf();
global.MACHINE = MACHINE;

class _wan_scheme{
    PPPD = 1;
    UDHCPC = 2;
}
var WANScheme = new _wan_scheme();
global.WANScheme = WANScheme;