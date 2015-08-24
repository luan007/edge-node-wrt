class _section_const {
    NETWORK_ADDRESS = "192.168.88.1";
    NETWORK_ADDRESS_BEGIN = "192.168.88.10";
    NETWORK_ADDRESS_END = "192.168.88.230";
    NETWORK_DNSMASQ = "network/dnsmasq";
    NETWORK_WIRELESS_2G = "network/wireless/2g";
    NETWORK_WIRELESS_5G = "network/wireless/5g";

    HOSTAPD_SOCK_FOLDER = "/tmp/fdsock/hostapd_aps/";
    DNSMASQ_LEASES_PATH = "/tmp/dnsmasq.leases";
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
}

var SECTION_CONST = new _section_const();
global.SECTION_CONST = SECTION_CONST;


var _section_conf_path = "/ramdisk/System/CI/SectionConf.json";
var _section_conf = {};
function _load_section_conf() {
    try {
        _section_conf = JSON.parse(fs.readFileSync(_section_conf_path).toString());
    } catch (err) {
        throw new Error("Section conf error: " + err.message);
    }
}
_load_section_conf();

function _get_real_path(key:string) {
    return _section_conf[key] && _section_conf[key].path;
}

global.ConfigRealPath = _get_real_path;
global.ReloadConfigs = _load_section_conf;