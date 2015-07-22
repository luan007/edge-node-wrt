import child_process = require("child_process");
import events = require("events");
import fs = require("fs");
import path = require("path");
import util = require("util")

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

    Primary(callback:Callback) {
        var newcb = must(callback, 5000);
        exec(Gatttool.cmd, "-i", this.hciInterface, "-b", this.MAC, "--primary", (err, data)=> {
            if (err) return newcb(err);
            if (this.__IsError(data)) return newcb(new Error(data));
            if (!Gatttool.primaryRegExp.exec(data)) return newcb(new Error(data));

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

            return newcb(undefined, res);
        });
    }

    Characteristics(callback:Callback) {
        var newcb = must(callback, 5000);
        exec(Gatttool.cmd, "-i", this.hciInterface, "-b", this.MAC, "--characteristics", (err, data)=> {
            if (err) return newcb(err);
            if (this.__IsError(data)) return newcb(new Error(data));
            if (!Gatttool.characteristicsRegExp.exec(data)) return newcb(new Error(data));

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

            return newcb(undefined, res);
        });
    }
}