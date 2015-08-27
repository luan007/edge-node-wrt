var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var async = require("async");
var utils = require("./Utils");
var Section = require("../CI/Section");

var cmd = "dnsmasq";
export var Config = "/ramdisk/System/Configs/dnsmasq.conf";

function readConf() {
    if (fs.existsSync(Config)) {
        var contents = fs.readFileSync(Config, {encoding: 'utf-8'}).toString().trim();
        if (contents) {
            return contents.trim("\n").split("\n");
        }
    }
    return [];
}

function run(cb){
    var args = readConf();
    if(args.length > 0) {
        //console.log("args", args);
        var ps = child_process.spawn(cmd, args);
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
        //console.log("killall " + cmd, error, stdout);
        cb();
    });
}

export function FileChanged(curr, prev) {
    if (curr.mtime !== prev.mtime) {
        console.log(Config, 'has been changed. curr mtime is: ',
            curr.mtime, 'prev mtime was: ' + prev.mtime);

        Start();
    }
}

export function Start() {
    utils.QueryProcess(cmd, function (err, res){
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
export function IsAlive(cb) {
    return utils.QueryProcess(cmd, function (err, res){
        return cb(undefined, (res && res.length));
    });
}

export function GenerateConfig(cb) {
    var handler = Section.GetSection(SECTION_CONST.NETWORK_DNSMASQ);
    //handler.Write("-k");
    //handler.Write("--dhcp-script", "/ramdisk/System/Configs/Scripts/dnsmasq_send.sh");
    //handler.Write("--dhcp-option", "44,6");
    handler.Write("--dhcp-option", "6," + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--listen-address", SECTION_CONST.NETWORK_ADDRESS + ",127.0.0.1");
    handler.Write("--expand-hosts");
    handler.Write("--stop-dns-rebind");
    handler.Write("--dhcp-sequential-ip");
    handler.Write("--domain", "edge");
    handler.Write("--dhcp-range", SECTION_CONST.NETWORK_ADDRESS_BEGIN + "," + SECTION_CONST.NETWORK_ADDRESS_END);
    handler.Write("--cache-size", "4096");
    handler.Write("--address", "/.wi.fi/" + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--address", "/.wifi.network/" + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--address", "/.ed.ge/" + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--address", "/.wifi/" + SECTION_CONST.NETWORK_ADDRESS);
    //handler.Write("--addn-hosts", "/ramdisk/System/Configs/Miscs/dnsmasq_dhcp_hostsfile.conf");
    //handler.Write("--dhcp-hostsfile", "/ramdisk/System/Configs/Miscs/dnsmasq_addn_hosts.conf");
    //handler.Write("--servers-file", "/ramdisk/System/Configs/Miscs/dnsmasq_server_file.conf");
    handler.Write("--server", "8.8.8.8");
    handler.Write("--server", "4.4.4.4");

    handler.Flush(cb);
}

var leases = {};
export function Fetch(cb) {
    var staging = {};
    fs.readFile(SECTION_CONST.DNSMASQ_LEASES_PATH, function (err, data) {
        if (err) return cb(err);
        if (!data) return cb();

        var rows = (<any>data.toString()).trim().split("\n");
        for (var i in rows) {
            if(rows[i]) {
                var parts = rows[i].split(" ");
                var lease = {
                    expires: Number(parts[0]) * 1000,
                    mac: parts[1].toLowerCase(),
                    ip: parts[2],
                    device: parts[3],
                    other: parts[4]
                };
                if (!leases[lease.mac]) {
                    console.log("NEW: ", lease);
                } else if(new Date().getTime() > leases[lease.mac].expires) {
                    console.log("STALE: ", lease);
                }
                staging[lease.mac] = lease;
            }
        }
        for (var k in leases) {
            if (!staging[k]) {
                console.log("DEL: ", k);
            }
        }
        leases = staging;
        return cb(undefined, leases);
    });
}