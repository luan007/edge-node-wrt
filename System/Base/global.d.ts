
//declare var IS_DEBUG: boolean;
//declare var BYPASS_APP_SIGCHECK: boolean;
//declare var PROCESS_DEBUG: boolean;
//declare var SHOW_NGINX_CONF: boolean;
//declare var CMD_DEBUG: boolean;
//declare var TIMER_LOG: boolean;
//declare var ROOT_LEVEL_SECURITY: boolean;
//declare var TIMEOUT_LOG: boolean;
//declare var ENABLE_FULL_LOG: boolean;
//declare var ARP_TIMEOUT: number;
//declare var BASE_PATH: string;
//declare var APP_BASE_PATH: string;
//declare var PLATFORM_BIAS_FS_SPLITTER: string;
//declare var DATA_DIR: string;
//declare var MODULE_DIR: string;
//declare var MAIN_SQL_PATH: string;
//declare var MAIN_REGISTRY_PATH: string;
//declare var BASE_DATA_PATH: string;
//declare var ISO_DEFAULT_LIMIT: number;
//declare var APP_TRUST_LIFE: number;
//declare var APP_SPAN_SCALER: number;
//declare var APP_RESP_SCAN_INTERVAL: number;
//declare var AUTO_LOAD_APPS: boolean;
//declare var SHADOW_DATA_PATH: string;
//declare var SHADOW_BASE_PATH: string;
//declare var DEV_STORAGE: string;
//declare var DO_NOT_DETACH: boolean;
//declare var ENABLE_EXEC_QUEUEING: boolean;
//declare var SENDER_TYPE_APP : string;
//declare var SENDER_TYPE_PROXY: string;
//declare var GRAPHD_LOCATION: string;
//declare var GRAPHD_UPGRADE_LOCATION: string;
//declare var DEVICE_SAVE_INTERVAL;
//declare var MAX_DRIVERCHAIN_DEPTH;


//declare var WLAN_2G_DEV: string;
//declare var WLAN_5G_DEV: string;

//declare var DRV_MATCH_TIMEOUT;


//declare enum SYS_EVENT_TYPE {
//    LOADED,
//    ERROR,
//}
declare function SYS_ON(name: SYS_EVENT_TYPE, callback: Function);
declare function SYS_REMOVELISTENER(name: SYS_EVENT_TYPE, callback: Function);
declare function SYS_TRIGGER(name: SYS_EVENT_TYPE, ...args);



//declare var CORE_PARTS: IDic<string>;