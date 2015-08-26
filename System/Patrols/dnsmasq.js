#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var async = require("async");
var utils = require("./utils");

var cmd = "dnsmasq";
var conf = "/ramdisk/System/Configs/dnsmasq.conf";


function readConf() {
    if (fs.existsSync(conf)) {
        var contents = fs.readFileSync(conf, {encoding: 'utf-8'}).toString().trim();
        if (contents) {
            return contents.trim("\n").split("\n");
        }
    }
    return [];
}

function run(cb){
    var args = readConf();
    if(args.length > 0) {
        console.log("args", args);
        var ps = child_process.spawn(cmd, args, {detached: true});
        ps.stdout.on('data', function (data) {
            console.log(data.toString().cyan);
        });
        ps.stderr.on('data', function (data) {
            console.log('ps stderr: ' + data.toString().red);
        });
        cb();
    }
    else return cb("invalid conf format.");
}
function kill(cb) {
    child_process.exec("killall " + cmd, function(error, stdout) {
        console.log("killall " + cmd, error, stdout);
        cb();
    });
}

function fileChanged(curr, prev) {
    if (curr.mtime !== prev.mtime) {
        console.log(conf, 'has been changed. curr mtime is: ',
            curr.mtime, 'prev mtime was: ' + prev.mtime);

        utils.queryProcess(cmd, function (err, res){
            if(err){
                return console.log(err);
            } else {
                var jobs = [];
                if(res)
                    jobs.push(function(cb){kill(cb);});
                jobs.push(function(cb){run(cb);});
                async.series(jobs, function(){});
            }
        });
    }
}
fs.watchFile(conf, fileChanged);