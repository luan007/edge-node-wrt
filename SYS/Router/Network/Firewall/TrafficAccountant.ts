﻿import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import path = require('path');

interface Traffic {
    //Chain:string;
    //IP:string;
    Bytes:number;
    Packets:number;
    //Delta_Bytes:number;
    //Delta_Time:number;
}

interface DeviceTraffic {
    IP: string;
    InternetUpStream: Traffic;
    InternetDownStream: Traffic;
    IntranetUpStream: Traffic;
    IntranetDownStream: Traffic;
}

export var Devices:IDic<DeviceTraffic> = {};
var IpMacMapping:IDic<string> = {};

var scriptPath = path.join(process.env.ROOT_PATH, 'Scripts/Router/Network/traffic.sh')
    , iptables = 'iptables'
    , filter = 'filter'
    , forward = 'FORWARD'
    , internet_up_traffic = 'internet_up_traffic'
    , internet_down_traffic = 'internet_down_traffic'
    , intranet_up_traffic = 'intranet_up_traffic'
    , intranet_down_traffic = 'intranet_down_traffic';

function extractTraffic(trafficChain) {
    for (var ip in trafficChain) {
        var mac = IpMacMapping[ip];
        if (mac && Devices[mac]) {
            trafficChain[ip];

        }
    }
}
function parseTraffic() {
    warn('traffic sh', scriptPath);
    exec('sh', scriptPath, (err, res)=> {
        if (err) error(err);
        else {
            var json = JSON.parse(res);
            console.log(json);
            if (Object.keys(json.internet_down_traffic).length > 0) {
                extractTraffic(json.internet_down_traffic);
            }
            if (Object.keys(json.internet_up_traffic).length > 0) {
                extractTraffic(json.internet_up_traffic);
            }
            if (Object.keys(json.intranet_down_traffic).length > 0) {
                extractTraffic(json.intranet_down_traffic);
            }
            if (Object.keys(json.intranet_up_traffic).length > 0) {
                extractTraffic(json.intranet_up_traffic);
            }
        }
    });
}
function getRule(ip, cb) {
    exec(iptables, '-L', internet_up_traffic, '|', 'grep', ip, cb);
}
function delSpecificRule(ip, chain, direction, cb) {
    exec(iptables, '-w', '-t', filter, '-D', chain, direction, ip, (err) => {
        if (!err)
            delSpecificRule(ip, chain, direction, cb);
        else
            cb();
    });
}
function delRule(ip, cb) {
    async.series([
        (cb) => {
            delSpecificRule(ip, internet_up_traffic, '-s', cb);
        }
        , (cb) => {
            delSpecificRule(ip, internet_down_traffic, '-d', cb);
        }
        , (cb) => {
            delSpecificRule(ip, intranet_up_traffic, '-s', cb);
        }
        , (cb) => {
            delSpecificRule(ip, intranet_down_traffic, '-d', cb);
        }
    ], (err) => {
        if (err) error(err);
        cb();
    });
}
function addRule(ip, packets, bytes) {
    exec(iptables, '-w', '-t', filter, '-A', internet_up_traffic, '-s', ip, '-c', packets, bytes);
    exec(iptables, '-w', '-t', filter, '-A', internet_down_traffic, '-d', ip, '-c', packets, bytes);
    exec(iptables, '-w', '-t', filter, '-A', intranet_up_traffic, '-s', ip, '-c', packets, bytes);
    exec(iptables, '-w', '-t', filter, '-A', intranet_down_traffic, '-d', ip, '-c', packets, bytes);
}

export function Initialize(cb) {
    setJob('traffic_accountant', parseTraffic, CONF.IPTABLES_TRAFFIC_INTERVAL);

    cb();
}

function setTraffic(networkAddress) {
    trace('set traffic rules.', networkAddress);
    exec(iptables, '-w', '-t', filter, '-R', forward, '1', '-s', networkAddress, '-o', CONF.DEV.ETH.DEV_WAN, '-j', internet_up_traffic);
    exec(iptables, '-w', '-t', filter, '-R', forward, '2', '-d', networkAddress, '-i', CONF.DEV.ETH.DEV_WAN, '-j', internet_down_traffic);
    exec(iptables, '-w', '-t', filter, '-R', forward, '3', '-s', networkAddress, '-d', networkAddress, '-j', intranet_up_traffic);
    exec(iptables, '-w', '-t', filter, '-R', forward, '4', '-s', networkAddress, '-d', networkAddress, '-j', intranet_down_traffic);
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.NETWORK);
    sub.devices.on('set', (mac, oldValue, leaseChanged) => {
        trace('devices.set', mac, leaseChanged);
        if (!Devices[mac]) {
            Devices[mac] = {
                IP: leaseChanged.Address
                , InternetUpStream: {Bytes: 0, Packets: 0}
                , InternetDownStream: {Bytes: 0, Packets: 0}
                , IntranetUpStream: {Bytes: 0, Packets: 0}
                , IntranetDownStream: {Bytes: 0, Packets: 0}
            };
            delRule(leaseChanged.Address, ()=> {
                addRule(ip, 0, 0);
            });
        } else {
            if (Devices[mac].IP !== leaseChanged.Address) { // IP Changed

            }
        }
        IpMacMapping[leaseChanged.Address] = mac;
    });
    sub.devices.on('del', (mac) => {
        trace('devices.del', mac);
        if (Devices[mac]) {
            var ip = Devices[mac].IP;
            if (ip && IpMacMapping[ip])
                delete IpMacMapping[ip];
            delete Devices[mac];
        }
    });
    sub.network.on('set', (key, oldValue, network)=> {
        if (has(network, 'NetworkAddress')) {
            setTraffic(network.NetworkAddress);
        }
    });
    cb();
}