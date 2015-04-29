import dns = require('dns');
import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import Status = require('../../../Common/Stat/Status');

class Configuration extends Config {

    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);
    }

    _apply = (delta, orginal, cb) => {
        var iptables:string = "iptables",
            ipset:string = "ipset",
            dev2G = CONF.DEV.WLAN.DEV_2G,
            dev5G = CONF.DEV.WLAN.DEV_5G,
            devGuest2G = CONF.DEV.WLAN.DEV_GUEST_2G,
            devGuest5G = CONF.DEV.WLAN.DEV_GUEST_5G,
            dev2GEnable = true,
            dev5GEnable = true,
            devGuest2GEnable = true,
            devGuest2GEnable = true,
            dev2GVlanIsolation = false,
            dev5GVlanIsolation = false,
            devGuest2GVlanIsolation = false,
            devGuest5GVlanIsolation = false,
            networkConf = ConfMgr.Get(SECTION.NETWORK),
            newworkAddress = networkConf['RouterIP'] + '/' + networkConf['LocalNetmask'];

        if (has(delta, "NAT")) {
            if (has(delta.NAT, "WLAN2G") && !delta.NAT.WLAN2G) dev2GEnable = false;
            if (has(delta.NAT, "WLAN5G") && !delta.NAT.WLAN5G) dev5GEnable = false;
            if (has(delta.NAT, "WLAN2G_Guest") && !delta.NAT.WLAN2G_Guest) devGuest2GEnable = false;
            if (has(delta.NAT, "WLAN5G_Guest") && !delta.NAT.WLAN5G_Guest) devGuest2GEnable = false;

            exec(iptables, '-w', '-t', 'nat', '-R', 'wifi_nat', '1', '-i', dev2G, '-j', dev2GEnable ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'wifi_nat', '2', '-i', dev5G, '-j', dev5GEnable ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'wifi_nat', '3', '-i', devGuest2G, '-j', devGuest2GEnable ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'wifi_nat', '4', '-i', devGuest5G, '-j', devGuest2GEnable ? 'RETURN' : 'DROP');
        }

        if (has(delta, "VLAN_Isolation")) {
            if (has(delta.VLAN_Isolation, "WLAN2G") && delta.VLAN_Isolation.WLAN2G) dev2GVlanIsolation = true;
            if (has(delta.VLAN_Isolation, "WLAN5G") && delta.VLAN_Isolation.WLAN5G) dev5GVlanIsolation = true;
            if (has(delta.VLAN_Isolation, "WLAN2G_Guest") && delta.VLAN_Isolation.WLAN2G_Guest) devGuest2GVlanIsolation = true;
            if (has(delta.VLAN_Isolation, "WLAN5G_Guest") && delta.VLAN_Isolation.WLAN5G_Guest) devGuest5GVlanIsolation = true;

            exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '1', '-s', newworkAddress, '-i', dev2G, '-j', dev2GVlanIsolation ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '2', '-d', newworkAddress, '-i', dev2G, '-j', dev2GVlanIsolation ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '3', '-s', newworkAddress, '-i', dev5G, '-j', dev5GVlanIsolation ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '4', '-d', newworkAddress, '-i', dev5G, '-j', dev5GVlanIsolation ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '5', '-s', newworkAddress, '-i', devGuest2G, '-j', devGuest2GVlanIsolation ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '6', '-d', newworkAddress, '-i', devGuest2G, '-j', devGuest2GVlanIsolation ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '7', '-s', newworkAddress, '-i', devGuest5G, '-j', devGuest5GVlanIsolation ? 'RETURN' : 'DROP');
            exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '8', '-d', newworkAddress, '-i', devGuest5G, '-j', devGuest5GVlanIsolation ? 'RETURN' : 'DROP');
        }

        if (has(delta, "EnableNginxProxy")) {
            if (delta.EnableNginxProxy)
                exec(iptables, '-w', '-t', 'nat', '-R', 'nginx_proxy', '1', '-p', 'tcp', '--dport', '80', '-j', 'REDIRECT', '--to-ports', '3378');
            else
                exec(iptables, '-w', '-t', 'nat', '-R', 'nginx_proxy', '1', '-p', 'tcp', '--dport', '80', '-j', 'DROP');
        }

        if (has(delta, "BlockedRemoteAddresses") && Array.isArray(delta.BlockedRemoteAddresses)) {
            delta.BlockedRemoteAddresses.forEach((hostname) => {
                dns.resolve4(hostname, (err, addresses)=> {
                    if (!err){
                        trace('ban hostname:', hostname, addresses);
                        addresses.forEach((address) => {
                            exec(ipset, 'add', 'block_remote_addresses', address);
                        });
                    }
                });
            });
        }
    }

    public Initialize = (cb) => {
        var _default = this.Get();
        this.Reload(_default, cb);
    };
}

var defaultConfig = {
    NAT: {
        WLAN2G: true,
        WLAN5G: true,
        WLAN2G_Guest: true,
        WLAN5G_Guest: true
    },
    VLAN_Isolation: {
        WLAN2G: false,
        WLAN5G: false,
        WLAN2G_Guest: true,
        WLAN5G_Guest: true
    },
    BlockedRemoteAddresses: [],
    //Client-Related stuff should be keyed with device_id/user_id
    //ClientInternetRestrictions: [],
    //ClientRouterRestrictions: [],
    //ClientNeighborRestrictions: [],
    //ClientPortMap: [], ---> need PortMapper.ts with its own config & logic
    EnableNginxProxy: true
};


var configFirewall = new Configuration(SECTION.FIREWALL, defaultConfig);

StatMgr.Sub(SECTION.NETWORK, (moduleName, delta) => {
    var statuses = StatMgr.GetByModule(moduleName),
        routerIP = statuses.RouterIP,
        localNetmask = statuses.LocalNetmask;
    if (has(delta, "RouterIP")) {
        routerIP= delta.RouterIP;
    }
    if(has(delta, "LocalNetmask")){
        localNetmask = delta.LocalNetmask;
    }
    var conf:any = ConfMgr.Get(SECTION.FIREWALL);
    if (has(conf, "VLAN_Isolation")) {
        var iptables:string = "iptables",
            dev2G = CONF.DEV.WLAN.DEV_2G,
            dev5G = CONF.DEV.WLAN.DEV_5G,
            devGuest2G = CONF.DEV.WLAN.DEV_GUEST_2G,
            devGuest5G = CONF.DEV.WLAN.DEV_GUEST_5G,
            dev2GVlanIsolation = false,
            dev5GVlanIsolation = false,
            devGuest2GVlanIsolation = false,
            devGuest5GVlanIsolation = false,
            newworkAddress = routerIP + '/' + localNetmask;
        if (has(conf.VLAN_Isolation, "WLAN2G") && conf.VLAN_Isolation.WLAN2G) dev2GVlanIsolation = true;
        if (has(conf.VLAN_Isolation, "WLAN5G") && conf.VLAN_Isolation.WLAN5G) dev5GVlanIsolation = true;
        if (has(conf.VLAN_Isolation, "WLAN2G_Guest") && conf.VLAN_Isolation.WLAN2G_Guest) devGuest2GVlanIsolation = true;
        if (has(conf.VLAN_Isolation, "WLAN5G_Guest") && conf.VLAN_Isolation.WLAN5G_Guest) devGuest5GVlanIsolation = true;

        exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '1', '-s', newworkAddress, '-i', dev2G, '-j', dev2GVlanIsolation ? 'RETURN' : 'DROP');
        exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '2', '-d', newworkAddress, '-i', dev2G, '-j', dev2GVlanIsolation ? 'RETURN' : 'DROP');
        exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '3', '-s', newworkAddress, '-i', dev5G, '-j', dev5GVlanIsolation ? 'RETURN' : 'DROP');
        exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '4', '-d', newworkAddress, '-i', dev5G, '-j', dev5GVlanIsolation ? 'RETURN' : 'DROP');
        exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '5', '-s', newworkAddress, '-i', devGuest2G, '-j', devGuest2GVlanIsolation ? 'RETURN' : 'DROP');
        exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '6', '-d', newworkAddress, '-i', devGuest2G, '-j', devGuest2GVlanIsolation ? 'RETURN' : 'DROP');
        exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '7', '-s', newworkAddress, '-i', devGuest5G, '-j', devGuest5GVlanIsolation ? 'RETURN' : 'DROP');
        exec(iptables, '-w', '-t', 'nat', '-R', 'vlan_isolation', '8', '-d', newworkAddress, '-i', devGuest5G, '-j', devGuest5GVlanIsolation ? 'RETURN' : 'DROP');
    }
});
__API(withCb(configFirewall.Get), "Network.Firewall.Config.Get", [Permission.Network, Permission.Configuration]);