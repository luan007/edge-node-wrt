var os = require("os");
var arch = os.arch();


declare var path;
class _sys_conf {
    LOADED = false; // don't touch
    IS_DEBUG = true;
    ALWAYS_REBUILD_OUI = false;
    INTERACTIVE_DEBUG = true;
    IPTABLES_GUARD_LOG = false;
    DISABLE_SAMBA = true;
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
    BASE_PATH = path.join(__dirname, "../");
    SHADOW_BASE_PATH = "/SagittariusA/"
    SHADOW_DATA_PATH = path.join(this.SHADOW_BASE_PATH, "Data");
    DEV_STORAGE = "/dev/mmcblk0p1"; // system partition, as for onboard-emmc configuration: /dev/mmcblk0p1
    BASE_DATA_PATH = "/Data/";
    USER_DATA_PATH = path.join("/User/");
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
    SHOW_NGINX_CONF = true;
    DEVICE_SAVE_INTERVAL = 30000;
    USERAUTH_PATROL_INTERVAL = 30000;
    MAX_DRIVERCHAIN_DEPTH = 30;
    DRV_MATCH_TIMEOUT = 1500;
    SENDER_TYPE_APP = "App";
    SENDER_TYPE_PROXY = "Proxy";
    BASE_FIREWALL = false;
    SSDP_PORT = 9979;
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
        HOST: "192.168.31.154", //for test onboard
        PORT: 8080,
        DEFAULT_TIMEOUT: 20000
    };
    USER_IMMEDIATE_EXPIRE = false;
    IPTABLES_6 = false;

}

class _section {
    NETWORK ='NETWORK';
    WLAN5G = 'WLAN5G';
    WLAN2G = 'WLAN2G';
    BLUETOOTH = 'BLUETOOTH';
    FIREWALL = "FIREWALL";
}

var CONF = new _sys_conf();
global.CONF = CONF;

var SECTION = new _section();
global.SECTION = SECTION;


if (arch !== "arm") {
    CONF.ORBIT.HOST = "127.0.0.1";
    CONF.DEV_STORAGE = "/dev/sda1";
}

console.log(CONF);

class _mac_conf {
    ROUTERID = "TEST_ROUTER_0";
    ModelName = "Edge Dev";
    ModelNumber = " _D_E_V_ ";
    Serial = "______";
    Major = "0";
    Minor = "0";
    ModelUrl = "http://edge.network";
    DefaultUrl = "http://wifi.network";
}

var MACHINE = new _mac_conf();
global.MACHINE = MACHINE;