import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import _Configurable = require('../../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import path = require('path');
import Traffic = require('../../../DB/Models/Traffic');
import Device = require('../../../DB/Models/Device');

var pub = StatMgr.Pub(SECTION.TRAFFIC, {
    traffics: {},
    system:{}
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

interface SystemTraffic {
    internet_up_traffic: Array<number>;
    internet_down_traffic: Array<number>;
    intranet_up_traffic: Array<number>;
    intranet_down_traffic: Array<number>;
}

var lastError:any = null;

export var Devices:IDic<DeviceTraffic> = {};
var IpMacMapping:IDic<string> = {};
var deltaDevices = [];
var systemTraffic:SystemTraffic = {
    internet_up_traffic: [0, 0],
    internet_down_traffic: [0, 0],
    intranet_up_traffic: [0, 0],
    intranet_down_traffic: [0, 0]
};

var scriptPath = path.join(process.env.ROOT_PATH, 'Scripts/Network/traffic.sh')
    , jobName = 'traffic_accountant'
    , iptables = 'iptables'
    , filter = 'filter'
    , forward = 'FORWARD'
    , total_traffic = 'total_traffic'
    , changed = false
    , internet_up_traffic = 'internet_up_traffic'
    , internet_down_traffic = 'internet_down_traffic'
    , intranet_up_traffic = 'intranet_up_traffic'
    , intranet_down_traffic = 'intranet_down_traffic';

function extractTraffic(trafficChain, chainName) {
    for (var ip in trafficChain) {
        var mac = IpMacMapping[ip];
        if (mac && Devices[mac]) {
            var packets = trafficChain[ip][0],
                bytes = trafficChain[ip][1],
                device = Devices[mac],
                delta = false;
            if (device[chainName].Packets < packets) {
                if (device[chainName].LastMeasure)
                    device[chainName].Delta_Time = new Date().getTime() - device[chainName].LastMeasure;
                device[chainName].LastMeasure = new Date().getTime();
                device[chainName].Delta_Packets = packets - device[chainName].Packets;
                device[chainName].Packets = packets;
                delta = true;
            }
            if (device[chainName].Bytes < bytes) {
                device[chainName].Delta_Bytes = bytes - device[chainName].Bytes;
                device[chainName].Bytes = bytes;
                delta = true;
            }
            if (delta && deltaDevices.indexOf(mac) === -1)
                deltaDevices.push(mac);
        }
    }
}

function __compareNumberArray(array1, array2) {
    return array1.reduce((a, b)=> {
            return a + b
        }) - array2.reduce((a, b)=> {
            return a + b
        });
}
function extractSystemTraffic(total_traffic) {
    for (var k in systemTraffic) {
        if (__compareNumberArray(total_traffic[k], systemTraffic[k]) > 0) {
            changed = true;
            systemTraffic = total_traffic;
            return;
        }
    }
}

function _patrolThread() {
    if (changed) {
        info(" traffic accountant save DB PATROL ".bold["magentaBG"]);
        SaveToDB(() => {
            info("DONE");
        });
        changed = false;
    }
}

function SaveToDB(callback:Callback) {
    Traffic.Table.one({uid: total_traffic}, (err, result) => {
        var upgrade = false;
        var data = <any>{};
        if (!err && result) {
            upgrade = true;
        }
        data.uid = total_traffic;
        data.internet_up_pkts = systemTraffic.internet_up_traffic[0];
        data.internet_up_bytes = systemTraffic.internet_up_traffic[1];
        data.internet_down_pkts = systemTraffic.internet_down_traffic[0];
        data.internet_down_bytes = systemTraffic.internet_down_traffic[1];
        data.intranet_up_pkts = systemTraffic.intranet_up_traffic[0];
        data.intranet_up_bytes = systemTraffic.intranet_up_traffic[1];
        data.intranet_down_pkts = systemTraffic.intranet_down_traffic[0];
        data.intranet_down_bytes = systemTraffic.intranet_down_traffic[1];
        if (upgrade) {
            info("Upgrading " + total_traffic);
            result.save(data, callback);
        } else {
            info("Saving " + total_traffic);
            Traffic.Table.create(data, callback);
        }
    });
}

function parseTraffic(callback?:Callback) {
    exec('sh', scriptPath, (err, res)=> {
        if (err) {
            lastError = err;
            error(err);
        }
        else {
            try {
                deltaDevices.length = 0; // clear
                var json = JSON.parse(res.replace(/\,$/gmi, '')); // remove trail comma
                if (Object.keys(json.internet_down_traffic).length > 0) {
                    extractTraffic(json.internet_down_traffic, internet_down_traffic);
                }
                if (Object.keys(json.internet_up_traffic).length > 0) {
                    extractTraffic(json.internet_up_traffic, internet_up_traffic);
                }
                if (Object.keys(json.intranet_down_traffic).length > 0) {
                    extractTraffic(json.intranet_down_traffic, intranet_down_traffic);
                }
                if (Object.keys(json.intranet_up_traffic).length > 0) {
                    extractTraffic(json.intranet_up_traffic, intranet_up_traffic);
                }
                if (Object.keys(json[total_traffic]).length > 0) {
                    extractSystemTraffic(json[total_traffic]);
                }
                for (var i = 0, len = deltaDevices.length; i < len; i++) {
                    var mac = deltaDevices[i];
                    var traffic = JSON.parse(JSON.stringify(Devices[mac]));
                    pub.traffics.Set(mac, traffic);
                }
                var serializedDevice = JSON.parse(JSON.stringify(Devices));
                var serializedSystem = JSON.parse(JSON.stringify(systemTraffic));
                //pub.system.Set('traffic', serializedSystem);
                deltaDevices.length = 0; // clear

                if(callback)
                    return callback(undefined, {
                        device: serializedDevice,
                        system: serializedSystem
                    });

            } catch (err) {
                lastError = err;
                error(err);
            }
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
    setJob("TrafficDB", _patrolThread, CONF.IPTABLES_TRAFFIC_SAVE_INTERVAL);

    cb();
}

export function Diagnose(callback:Callback) {
    if (lastError) return callback(lastError);
    return callback(null, true);
}

function setTraffic(networkAddress) {
    var jobs = [];
    jobs.push((cb)=> {
        Traffic.Table.one({uid: total_traffic}, (err, result) => {
            if (result) return cb(undefined, result);
            return cb(undefined, {
                internet_up_pkts: 0,
                internet_up_bytes: 0,
                internet_down_pkts: 0,
                internet_down_bytes: 0,
                intranet_up_pkts: 0,
                intranet_up_bytes: 0,
                intranet_down_pkts: 0,
                intranet_down_bytes: 0
            });
        });
    });
    jobs.push((systemTraffic, cb)=> { // recover from DB
        trace('set traffic rules.', networkAddress);
        exec(iptables, '-w', '-t', filter, '-R', forward, '1', '-c', systemTraffic.internet_up_pkts, systemTraffic.internet_up_bytes,
            '-s', networkAddress, '-o', CONF.DEV.ETH.DEV_WAN, '-j', internet_up_traffic);
        exec(iptables, '-w', '-t', filter, '-R', forward, '2', '-c', systemTraffic.internet_down_pkts, systemTraffic.internet_down_bytes,
            '-d', networkAddress, '-i', CONF.DEV.ETH.DEV_WAN, '-j', internet_down_traffic);
        exec(iptables, '-w', '-t', filter, '-R', forward, '3', '-c', systemTraffic.intranet_up_pkts, systemTraffic.intranet_up_bytes,
            '-s', networkAddress, '-d', networkAddress, '-j', intranet_up_traffic);
        exec(iptables, '-w', '-t', filter, '-R', forward, '4', '-c', systemTraffic.intranet_down_pkts, systemTraffic.intranet_down_bytes,
            '-s', networkAddress, '-d', networkAddress, '-j', intranet_down_traffic);
        cb();
    });
    async.waterfall(jobs, ()=> {
    });
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.NETWORK);
    sub.leases.on('set', (mac, oldValue, leaseChanged) => {
        trace('devices.set', mac, leaseChanged);
        var device = Devices[mac];
        if (!device) { //doesn't exist
            var jobs = [];
            jobs.push((cb) => {
                Device.Table.one({hwaddr: mac}, (err, result)=> {
                    if (result && result.busdata && result.busdata['Traffic'])
                        return cb(undefined, result.busdata['Traffic']);
                    return cb(undefined, {
                        internet_up_traffic: {Bytes: 0, Packets: 0}
                        , internet_down_traffic: {Bytes: 0, Packets: 0}
                        , intranet_up_traffic: {Bytes: 0, Packets: 0}
                        , intranet_down_traffic: {Bytes: 0, Packets: 0}
                    });
                });
            });
            jobs.push((traffic, cb)=> {
                var packets = [
                    traffic.internet_up_traffic.Packets,
                    traffic.internet_down_traffic.Packets,
                    traffic.intranet_up_traffic.Packets,
                    traffic.intranet_down_traffic.Packets
                ];
                var bytes = [
                    traffic.internet_up_traffic.Bytes,
                    traffic.internet_down_traffic.Bytes,
                    traffic.intranet_up_traffic.Bytes,
                    traffic.intranet_down_traffic.Bytes
                ];
                Devices[mac] = {
                    IP: leaseChanged.Address
                    , internet_up_traffic: {Bytes: bytes[0], Packets: packets[0]}
                    , internet_down_traffic: {Bytes: bytes[1], Packets: packets[1]}
                    , intranet_up_traffic: {Bytes: bytes[2], Packets: packets[2]}
                    , intranet_down_traffic: {Bytes: bytes[3], Packets: packets[3]}
                };
                delRule(leaseChanged.Address, ()=> {
                    addRule(leaseChanged.Address, packets, bytes, ()=> {
                        cb();
                    });
                });
            });
            async.waterfall(jobs, ()=> {
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
    sub.leases.on('del', (mac) => {
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

    cb();
}

__API(parseTraffic, "Edge.Traffic.Get", [Permission.AnyApp]);