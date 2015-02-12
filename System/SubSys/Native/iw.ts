/*

    Watch ->
    /sys/kernel/debug/ieee80211/phy0/netdev:wlan1/stations/28:47:aa:27:16:6c

    /sys/kernel/debug/ieee80211/phy0/netdev:wlan1/stations/
                                -------->CHECK
*/

import path = require("path");
import fs = require("fs");
import process = require("child_process");

var _name = "IW_STATION";

var path_80211 = "/sys/kernel/debug/ieee80211/";

var pattern = /Station (\w{2}:\w{2}:\w{2}:\w{2}:\w{2}:\w{2}) \(on (\w+)\)+\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(\d+).*\n.+:\s+(.+)dBm\n.+:\s+(.+)dBm\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n.+:\s+(.+)\n/gm;

export interface STA {

    dev: string;
    signal: number;
    avg_signal: number;
    tx_bitrate: number; //MBits
    rx_packets: number;
    tx_packets: number;
    rx_bytes: number;
    tx_bytes: number;
    tx_retry: number;
    authorized: boolean;
    authenticated: boolean;
    tx_fail: number;
    tx_fragments: number;
    rx_fragments: number;
    tx_filtered: number;
    rx_duplicates: number;
    WWM_WME: boolean;
    tag: number;
    preamble: string;
    mac: string;
    TDLS: boolean;
    MFP: boolean;
}

var Watch: IDic<string> = {};

export var Devices: IDic<STA> = {};

export var Inspect_Interval = 20000;

export var Stop = false;

export function Initialize() {
    info("Starting Inspector " + (Inspect_Interval.toString() + '').bold["magentaBG"]);
    setTimeout(Inspect_Thread, Inspect_Interval);
}

export function Attach(dev: string) {
    dev = dev.toLowerCase();
    info("Attaching " + dev.bold);
    Watch[dev] = dev;
}

export function Detach(dev: string) {
    if (Watch[dev]) {
        info("Detaching " + dev.bold);
        delete Watch[dev];
        return;
    } else {
        return error(new Error(dev + " Not Found in Watchlist"), "Detach Failed");
    }
}

export function ImmediateSurvey(callback) {
    if (!callback) {
        return;
    }
    Inspect_Thread(callback);
}

export function Get(mac) {
    return Devices[mac];
}

function survey(dev, callback: (err, result) => any) {
    process.exec("iw dev " + dev + " station dump", (err, out, e) => {
        callback(err, out.toString("utf8"));
    });
}

var _timeout = undefined;
function Inspect_Thread(callback?) {
    if (_timeout !== undefined) {
        clearTimeout(_timeout);
    }
    var tag = new Date().getTime();
    var jobs = [];

    async.each(Object.keys(Watch), (dev, cb) => {
        survey(dev, (err, str) => {
            var match = [];
            while ((match = pattern.exec(str)) !== null) {
                var mac = match[1];
                if (!Devices[mac]) {
                    Devices[mac] = <STA>{
                        mac: mac
                    };
                }
                Devices[mac].tag = tag;
                Devices[mac].dev = match[2];
                //Devices[mac].inactivetime = match[3];
                Devices[mac].rx_bytes = parseInt(match[4]);
                Devices[mac].rx_packets = parseInt(match[5]);
                Devices[mac].tx_bytes = parseInt(match[6]);
                Devices[mac].tx_packets = parseInt(match[7]);
                Devices[mac].tx_retry = parseInt(match[8]);
                Devices[mac].tx_fail = parseInt(match[9]);
                Devices[mac].signal = parseInt(match[10]);
                Devices[mac].avg_signal = parseInt(match[11]);
                Devices[mac].tx_bitrate = parseInt(match[12]);
                Devices[mac].authorized = match[13] === "yes";
                Devices[mac].authenticated = match[14] === "yes";
                Devices[mac].preamble = match[15];
                Devices[mac].WWM_WME = match[16] === "yes";
                Devices[mac].MFP = match[17] === "yes";
                Devices[mac].TDLS = match[18] === "yes";
            }
            cb(undefined, undefined);
        });
    }, (result) => {
            for (var dev in Devices) {
                if (Devices[dev].tag != tag) {
                    Devices[dev] = undefined;
                }
            }
            if (!callback && !Stop) {
                _timeout = setTimeout(Inspect_Thread, Inspect_Interval);
            }
            else {
                callback();
            }
            if (Inspect_Interval / (new Date().getTime() - tag) < 100) {
                warn("!Hitting 0.5% CPU Limit! | " + (new Date().getTime() - tag).toString().bold + "/"
                + ('' + Inspect_Interval.toString()).bold);
            }
        });

    //for (var dev in Watch) {
    //    //if dev exist
    //    /*
    //     *  Station 28:47:aa:27:16:6c (on wlan1)
    //     *  inactive time:	5220 ms
    //     *  rx bytes:	28395
    //     *  rx packets:	382
    //     *  tx bytes:	115623
    //     *  tx packets:	231
    //     *  tx retries:	143
    //     *  tx failed:	14
    //     *  signal:  	-53 dBm
    //     *  signal avg:	-46 dBm
    //     *  tx bitrate:	65.0 MBit/s MCS 7
    //     *  authorized:	yes
    //     *  authenticated:	yes
    //     *  preamble:	short
    //     *  WMM/WME:	yes
    //     *  MFP:		no
    //     *  TDLS peer:		no
    //     */
    //    jobs.push((cb) => {
    //        survey(dev, (err, str) => {
    //            var match = [];
    //            while ((match = pattern.exec(str)) !== null) {
    //                var mac = match[1];
    //                if (!Devices[mac]) {
    //                    Devices[mac] = <STA>{
    //                        mac: mac
    //                    };
    //                }
    //                Devices[mac].tag = tag;
    //                Devices[mac].dev = match[2];
    //                //Devices[mac].inactivetime = match[3];
    //                Devices[mac].rx_bytes = parseInt(match[4]);
    //                Devices[mac].rx_packets = parseInt(match[5]);
    //                Devices[mac].tx_bytes = parseInt(match[6]);
    //                Devices[mac].tx_packets = parseInt(match[7]);
    //                Devices[mac].tx_retry = parseInt(match[8]);
    //                Devices[mac].tx_fail = parseInt(match[9]);
    //                Devices[mac].signal = parseInt(match[10]);
    //                Devices[mac].avg_signal = parseInt(match[11]);
    //                Devices[mac].tx_bitrate = parseInt(match[12]);
    //                Devices[mac].authorized = match[13] === "yes";
    //                Devices[mac].authenticated = match[14] === "yes";
    //                Devices[mac].preamble = match[15];
    //                Devices[mac].WWM_WME = match[16] === "yes";
    //                Devices[mac].MFP = match[17] === "yes";
    //                Devices[mac].TDLS = match[18] === "yes";
    //            }
    //            cb();
    //        });
    //    });
    //}

    //async.series(jobs, () => {
    //    for (var dev in Devices) {
    //        if (Devices[dev].tag != tag) {
    //            Devices[dev] = undefined;
    //        }
    //    }
    //    if (!callback) {
    //        _timeout = setTimeout(Inspect_Thread, Inspect_Interval);
    //    }
    //    else {
    //        callback();
    //    }
    //    if (Inspect_Interval / (new Date().getTime() - tag) < 100) {
    //        warn("!Hitting 0.5% CPU Limit! | " + (new Date().getTime() - tag).toString().bold + "/" + Inspect_Interval.toString().bold);
    //    }
    //});

    //log("DELTA:" + (new Date().getTime() - tag) + "ms");
}