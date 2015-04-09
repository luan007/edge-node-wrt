var process = require("child_process");
var _name = "IW_STATION";
var path_80211 = "/sys/kernel/debug/ieee80211/";
var pattern = /Station (\w{2}:\w{2}:\w{2}:\w{2}:\w{2}:\w{2}) \(on (\w+)\)+\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(.+)dBm\n.+:\s+(.+)dBm\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n/gm;
var _devList = {};
var WatchList = {};
exports.Devices = {};
exports.Inspect_Interval = 15000;
exports.Stop = false;
function Initialize(cb) {
    info("Starting Inspector " + (exports.Inspect_Interval.toString() + '').bold["magentaBG"]);
    setTimeout(Inspect_Thread, exports.Inspect_Interval);
    cb();
}
exports.Initialize = Initialize;
function Unwatch(mac) {
    delete WatchList[mac.toLowerCase()];
}
exports.Unwatch = Unwatch;
function Watch(mac, cb) {
    WatchList[mac.toLowerCase()] = {
        prev: {},
        f: cb
    };
}
exports.Watch = Watch;
function Attach(dev) {
    dev = dev.toLowerCase();
    info("Attaching " + dev.bold);
    _devList[dev] = dev;
}
exports.Attach = Attach;
function Detach(dev) {
    if (_devList[dev]) {
        info("Detaching " + dev.bold);
        delete _devList[dev];
        return;
    }
    else {
        return error(new Error(dev + " Not Found in Watchlist"), "Detach Failed");
    }
}
exports.Detach = Detach;
function ImmediateSurvey(callback) {
    if (!callback) {
        return;
    }
    Inspect_Thread(callback);
}
exports.ImmediateSurvey = ImmediateSurvey;
function Get(mac) {
    return exports.Devices[mac];
}
exports.Get = Get;
function survey(dev, callback) {
    if (CONF.IS_DEBUG && CONF.IW_LOG) {
        info("IW Scan - " + dev);
    }
    process.exec("iw dev " + dev + " station dump", function (err, out, e) {
        callback(err, out.toString("utf8"));
    });
}
var _timeout = undefined;
function Inspect_Thread(callback) {
    if (_timeout !== undefined) {
        clearTimeout(_timeout);
    }
    var tag = new Date().getTime();
    var jobs = [];
    async.each(Object.keys(_devList), function (dev, cb) {
        survey(dev, function (err, str) {
            var match = [];
            while ((match = pattern.exec(str)) !== null) {
                var mac = match[1].toLowerCase();
                if (!exports.Devices[mac]) {
                    exports.Devices[mac] = {
                        mac: mac
                    };
                }
                exports.Devices[mac].tag = tag;
                exports.Devices[mac].dev = match[2];
                exports.Devices[mac].rx_bytes = parseInt(match[4]);
                exports.Devices[mac].rx_packets = parseInt(match[5]);
                exports.Devices[mac].tx_bytes = parseInt(match[6]);
                exports.Devices[mac].tx_packets = parseInt(match[7]);
                exports.Devices[mac].tx_retry = parseInt(match[8]);
                exports.Devices[mac].tx_fail = parseInt(match[9]);
                exports.Devices[mac].signal = parseInt(match[10]);
                exports.Devices[mac].avg_signal = parseInt(match[11]);
                exports.Devices[mac].tx_bitrate = parseInt(match[12]);
                exports.Devices[mac].authorized = match[13] === "yes";
                exports.Devices[mac].authenticated = match[14] === "yes";
                exports.Devices[mac].preamble = match[15];
                exports.Devices[mac].WWM_WME = match[16] === "yes";
                exports.Devices[mac].MFP = match[17] === "yes";
                exports.Devices[mac].TDLS = match[18] === "yes";
                if (WatchList[mac.toLowerCase()]) {
                    var prev = WatchList[mac.toLowerCase()].prev;
                    var update = false;
                    var change = delta_add_return_changes(prev, exports.Devices[mac], true, true);
                    if (Object.keys(change).length == 0) {
                        continue;
                    }
                    if (!(has(change, "rx_bytes") || has(change, "rx_packets") || has(change, "tx_bytes") || has(change, "tx_packets") || has(change, "tx_retry") || has(change, "tx_fail") || has(change, "signal") || has(change, "avg_signal"))) {
                        update = true;
                    }
                    else {
                        update = true;
                    }
                    if (update) {
                        delta_add_return_changes(prev, exports.Devices[mac], true);
                        WatchList[mac.toLowerCase()].f(exports.Devices[mac]);
                    }
                }
            }
            cb(undefined, undefined);
        });
    }, function (result) {
        for (var dev in exports.Devices) {
            if (exports.Devices[dev] && exports.Devices[dev].tag != tag) {
                exports.Devices[dev] = undefined;
            }
        }
        if (!exports.Stop) {
            _timeout = setTimeout(Inspect_Thread, exports.Inspect_Interval);
        }
        else {
            callback();
        }
        if (exports.Inspect_Interval / (new Date().getTime() - tag) < 100) {
            warn("!Hitting 0.5% CPU Limit! | " + (new Date().getTime() - tag).toString().bold + "/" + ('' + exports.Inspect_Interval.toString()).bold);
        }
    });
}
