import child_process = require("child_process");
import events = require("events");
import fs = require("fs");
import path = require("path");
import util = require("util")

var mac_list = {};
function __exists(MAC) {
    return has(mac_list, MAC);
}
function __add(MAC) {
    if(!has(mac_list, MAC))
        mac_list[MAC] = 1;
}
function __done(MAC) {
    delete mac_list[MAC];
}

export class Gatttool {
    static cmd = "gatttool";
    static primaryRegExp = /attr handle = (.*?), end grp handle = (.*?) uuid: ([^\n]+)/gmi;
    static characteristicsRegExp = /handle = (.*?), char properties = (.*?), char value handle = (.*?), uuid=([^\n]+)/gmi;

    constructor(private hciInterface:string, private MAC:string) {
    }

    __IsBusy(data) {
        return /Device or resource busy/gmi.test(data);
    }

    __IsRefused(data) {
        return /Connection Refused/gmi.test(data);
    }

    __IsError(data) {
        return /.*? \(\d+\)/gmi.test(data);
    }

    static Probe(MAC, callback:Callback){
        if(__exists(MAC)) return callback(new Error("query in progress."));
        __add(MAC);
        exec(Gatttool.cmd, "-i", CONF.DEV.BLUETOOTH.DEV_HCI, "-b", MAC, "--primary",  must((err)=>{
            __done(MAC);
            if(err) return callback(err);
            return callback(undefined);
        }, 5000));
    }

    Primary(callback:Callback) {
        if(__exists(this.MAC)) return callback(new Error("query in progress."));
        __add(this.MAC);
        exec(Gatttool.cmd, "-i", this.hciInterface, "-b", this.MAC, "--primary", must((err, data)=> {
            __done(this.MAC);
            if (err) return callback(err);
            if (this.__IsError(data)) return callback(new Error(data));
            if (!Gatttool.primaryRegExp.exec(data)) return callback(new Error(data));

            var lines = data.split("\n");
            var res = {};
            for (var i = 0, len = lines.length; i < len; i++) {
                var matched = Gatttool.primaryRegExp.exec(lines[i]);
                if (matched && matched.length > 3) {
                    var uuid = matched[3];
                    res[uuid] = {
                        attr_handle: matched[1],
                        end_grp_handle: matched[2]
                    };
                }
            }

            return callback(undefined, res);
        }, 5000));
    }

    Characteristics(callback:Callback) {
        if(__exists(this.MAC)) return callback(new Error("query in progress."));
        __add(this.MAC);
        exec(Gatttool.cmd, "-i", this.hciInterface, "-b", this.MAC, "--characteristics", must((err, data)=> {
            __done(this.MAC);
            if (err) return callback(err);
            if (this.__IsError(data)) return callback(new Error(data));
            if (!Gatttool.characteristicsRegExp.exec(data)) return callback(new Error(data));

            var lines = data.split("\n");
            var res = {};
            for (var i = 0, len = lines.length; i < len; i++) {
                var matched = Gatttool.characteristicsRegExp.exec(lines[i]);
                if (matched && matched.length > 4) {
                    var uuid = matched[4];
                    res[uuid] = {
                        handle: matched[1],
                        char_properties: matched[2],
                        char_value_handle: matched[3]
                    };
                }
            }

            return callback(undefined, res);
        }, 5000));
    }
}