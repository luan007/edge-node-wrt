import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import path = require('path');

var pub = StatMgr.Pub(SECTION.TRAFFIC, {
    traffics: {}
});

interface Traffic {
    //Chain:string;
    //IP:string;
    Bytes:number;
    Packets:number;
    Delta_Bytes?:number;
    Delta_Packets?:number;
    Delta_Time?:number;
    LastMeasure?: number;
}

interface DeviceTraffic {
    IP: string;
    internet_up_traffic: Traffic;
    internet_down_traffic: Traffic;
    intranet_up_traffic: Traffic;
    intranet_down_traffic: Traffic;
}

export var Devices:IDic<DeviceTraffic> = {};
var IpMacMapping:IDic<string> = {};

var scriptPath = path.join(process.env.ROOT_PATH, 'Scripts/Router/Network/traffic.sh')
    , jobName = 'traffic_accountant'
    , iptables = 'iptables'
    , filter = 'filter'
    , forward = 'FORWARD'
    , internet_up_traffic = 'internet_up_traffic'
    , internet_down_traffic = 'internet_down_traffic'
    , intranet_up_traffic = 'intranet_up_traffic'
    , intranet_down_traffic = 'intranet_down_traffic'
    , trafficsKey = 'traffics';

function extractTraffic(trafficChain, chainName, cb) {
    intoQueue(jobName, ()=> {
        for (var ip in trafficChain) {
            var mac = IpMacMapping[ip];
            if (mac && Devices[mac]) {
                var packets = trafficChain[ip][0],
                    bytes = trafficChain[ip][1],
                    device = Devices[mac];
                if (device[chainName].Packets < packets) {
                    if (device[chainName].LastMeasure)
                        device[chainName].Delta_Time = new Date().getTime() - device[chainName].LastMeasure;
                    device[chainName].LastMeasure = new Date().getTime();
                    device[chainName].Delta_Packets = packets - device[chainName].Packets;
                    device[chainName].Packets = packets;
                }
                if (device[chainName].Bytes < bytes) {
                    device[chainName].Delta_Bytes = bytes - device[chainName].Bytes;
                    device[chainName].Bytes = bytes;
                }
            }
        }
    }, cb);
}
function parseTraffic() {
    exec('sh', scriptPath, (err, res)=> {
        if (err) error(err);
        else {
            var json = JSON.parse(res.replace(/\,$/gmi, '')); // remove trail comma
            var jobs = [];
            if (Object.keys(json.internet_down_traffic).length > 0) {
                jobs.push((cb) => { extractTraffic(json.internet_down_traffic, internet_down_traffic, cb); });
            }
            if (Object.keys(json.internet_up_traffic).length > 0) {
                jobs.push((cb) => { extractTraffic(json.internet_up_traffic, internet_up_traffic, cb); });
            }
            if (Object.keys(json.intranet_down_traffic).length > 0) {
                jobs.push((cb) => { extractTraffic(json.intranet_down_traffic, intranet_down_traffic, cb); });
            }
            if (Object.keys(json.intranet_up_traffic).length > 0) {
                jobs.push((cb) => { extractTraffic(json.intranet_up_traffic, intranet_up_traffic, cb); });
            }
            async.series(jobs, ()=>{
                pub.Set(trafficsKey, Devices);
            });
        }
    });
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
            delSpecificRule(ip, internet_up_traffic, '-s', ()=> {
                cb();
            });
        }
        , (cb) => {
            delSpecificRule(ip, internet_down_traffic, '-d', ()=> {
                cb();
            });
        }
        , (cb) => {
            delSpecificRule(ip, intranet_up_traffic, '-s', ()=> {
                cb();
            });
        }
        , (cb) => {
            delSpecificRule(ip, intranet_down_traffic, '-d', ()=> {
                cb();
            });
        }
    ], (err) => {
        if (err) error(err);
        cb();
    });
}
function addRule(ip, packets, bytes, cb) {
    async.series([
        (cb) => {
            exec(iptables, '-w', '-t', filter, '-A', internet_up_traffic, '-s', ip, '-c', packets[0], bytes[0], ignore_err(cb));
        }
        , (cb) => {
            exec(iptables, '-w', '-t', filter, '-A', internet_down_traffic, '-d', ip, '-c', packets[1], bytes[1], ignore_err(cb));
        }
        , (cb) => {
            exec(iptables, '-w', '-t', filter, '-A', intranet_up_traffic, '-s', ip, '-c', packets[2], bytes[2], ignore_err(cb));
        }
        , (cb) => {
            exec(iptables, '-w', '-t', filter, '-A', intranet_down_traffic, '-d', ip, '-c', packets[3], bytes[3], ignore_err(cb));
        }
    ], (err)=> {
        if (err) error(err);
        cb();
    });
}

export function Initialize(cb) {
    setJob(jobName, parseTraffic, CONF.IPTABLES_TRAFFIC_INTERVAL);

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
        var device = Devices[mac];
        if (!device) { //doesn't exist
            Devices[mac] = {
                IP: leaseChanged.Address
                , internet_up_traffic: {Bytes: 0, Packets: 0}
                , internet_down_traffic: {Bytes: 0, Packets: 0}
                , intranet_up_traffic: {Bytes: 0, Packets: 0}
                , intranet_down_traffic: {Bytes: 0, Packets: 0}
            };
            delRule(leaseChanged.Address, ()=> {
                addRule(leaseChanged.Address, [0, 0, 0, 0], [0, 0, 0, 0], ()=> {
                });
            });
        } else {
            if (device.IP !== leaseChanged.Address) { // IP Changed
                delRule(device.IP, ()=> {
                    addRule(leaseChanged.Address,
                        [device.internet_up_traffic.Packets,
                            device.internet_down_traffic.Packets,
                            device.intranet_up_traffic.Packets,
                            device.intranet_down_traffic.Packets],
                        [device.internet_up_traffic.Bytes,
                            device.internet_down_traffic.Bytes,
                            device.intranet_up_traffic.Bytes,
                            device.intranet_down_traffic.Bytes],
                        ()=> {
                            device.IP = leaseChanged.Address;
                        });
                });
            }
        }
        IpMacMapping[leaseChanged.Address] = mac;
    });
    sub.devices.on('del', (mac) => {
        trace('devices.del', mac);
        if (Devices[mac]) {
            var ip = Devices[mac].IP;
            delRule(ip, () => {
                if (ip && IpMacMapping[ip])
                    delete IpMacMapping[ip];
                //delete Devices[mac];
            });
        }
    });
    sub.network.on('set', (key, oldValue, network)=> {
        if (has(network, 'NetworkAddress')) {
            setTraffic(network.NetworkAddress);
        }
    });

    var subSelf = StatMgr.Sub(SECTION.TRAFFIC);
    subSelf.internet_down_traffic.on('set', (key, oldValue, traffic) => {
        info('traffic was changed', key, traffic);
    });

    cb();
}