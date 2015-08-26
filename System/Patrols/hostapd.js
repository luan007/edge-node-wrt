#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var async = require("async");
var utils = require("./utils");

var cmd = "hostapd";
var conf_2g = "/ramdisk/System/Configs/hostapd_2g.conf";
var conf_5g = "/ramdisk/System/Configs/hostapd_5g.conf";

function run(conf, cb){
    var ps = child_process.spawn(cmd, [conf], {detached: true, stdio: 'pipe'});
    ps.stdout.on('hostapd data:', function (data) {
        console.log(data.toString().cyan);
    });
    ps.stderr.on('hostapd stderr:', function (data) {
        console.log('ps stderr: ' + data.toString().red);
    });
    cb();
}
function kill(pid, cb) {
    child_process.exec("kill -9 " + pid, function(error, stdout) {
        console.log("killed ".red, pid, error, stdout);
        cb();
    });
}

function fileChanged(conf) {
    return function(curr, prev) {
        if (curr.mtime !== prev.mtime) {
            console.log(conf, 'has been changed. curr mtime is: ',
                curr.mtime, 'prev mtime was: ' + prev.mtime);

            utils.queryProcess(cmd + " " + conf, function (err, res) {
                var jobs = [];
                if (res && res.pid)
                    jobs.push(function (cb) {
                        kill(res.pid, cb);
                    });
                jobs.push(function (cb) {
                    run(conf, cb);
                });
                async.series(jobs, function () {
                });
            });
        }
    };
}
fs.watchFile(conf_2g, fileChanged(conf_2g));
fs.watchFile(conf_5g, fileChanged(conf_5g));