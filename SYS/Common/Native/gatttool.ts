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
    if (!has(mac_list, MAC))
        mac_list[MAC] = 1;
}
function __done(MAC) {
    delete mac_list[MAC];
}

var primaryRegExp = /attr handle = (.*?), end grp handle = (.*?) uuid: ([^\n]+)/gmi;
var characteristicsRegExp = /handle = (.*?), char properties = (.*?), char value handle = (.*?), uuid=([^\n]+)/gmi;

function __IsError(data) {
    return /.*? \(\d+\)/gmi.test(data);
}

export function Primary(hciInterface, MAC, callback:Callback) {
    if (__exists(MAC)) return callback(new Error("query in progress."));
    var cmd = "gatttool -i " + hciInterface + " -b " + MAC + " --primary";
    trace("spawn command", cmd);
    __add(MAC);
    var ps = child_process.exec(cmd, must((err, data)=> {
        ps.kill();
        __done(MAC);
        if (err) return callback(err);
        if (__IsError(data)) return callback(new Error(data));
        if (!primaryRegExp.exec(data)) return callback(new Error(data));

        var lines = data.split("\n");
        var res = {};
        for (var i = 0, len = lines.length; i < len; i++) {
            var matched = primaryRegExp.exec(lines[i]);
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

export function Characteristics(hciInterface, MAC, callback:Callback) {
    if (__exists(MAC)) return callback(new Error("query in progress."));
    var cmd = "gatttool -i " + hciInterface + " -b " + MAC + " --characteristics";
    trace("spawn command", cmd);
    __add(MAC);
    var ps = child_process.exec(cmd, must((err, data)=> {
        ps.kill();
        __done(MAC);
        if (err) return callback(err);
        if (__IsError(data)) return callback(new Error(data));
        if (!characteristicsRegExp.exec(data)) return callback(new Error(data));

        var lines = data.split("\n");
        var res = {};
        for (var i = 0, len = lines.length; i < len; i++) {
            var matched = characteristicsRegExp.exec(lines[i]);
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


export function CharWriteReq(hciInterface, MAC, handle, data, cb) {
    var ps = child_process.exec("gatttool -i " + hciInterface + " -b " + MAC + " --char-write-req -a " + handle + " -n " + data,
        function (err, stdout, stderr) {
            ps.kill();
            if (err) return cb(err);
            return cb(undefined, stdout.toString());
        });
}

export function CharReadHandle(MAC, hciInterface, handle, cb) {
    var ps = child_process.exec("gatttool -i " + hciInterface + " -b " + MAC + " --char-read -a " + handle,
        function (err, stdout, stderr) {
            ps.kill();
            if (err) return cb(err);
            return cb(undefined, stdout.toString());
        });
}