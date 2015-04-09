var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Node = require("Node");
var unix = require("unix-dgram");
var Process = require("./Process");
var DHCPLeaseManager = (function (_super) {
    __extends(DHCPLeaseManager, _super);
    function DHCPLeaseManager(relay_path) {
        var _this = this;
        _super.call(this);
        this.relay_path = relay_path;
        this.WatchList = {};
        this.LeaseDB = {};
        this.Listen = function () {
            if (_this._socketclient) {
                _this._socketclient.close();
                _this._socketclient = null;
            }
            var sock = getSock(UUIDstr());
            if (Node.fs.existsSync(_this.relay_path) && Node.fs.unlinkSync(_this.relay_path))
                ;
            if (Node.fs.existsSync(sock) && Node.fs.unlinkSync(sock))
                ;
            var d = "#!/bin/bash\necho \"{ \\\"Action\\\":\\\"$1\\\", \\\"Lease\\\": { \\\"Mac\\\":\\\"$2\\\", \\\"Address\\\":\\\"$3\\\", \\\"Hostname\\\":\\\"$4\\\", \\\"VendorClass\\\":\\\"$DNSMASQ_VENDOR_CLASS\\\", \\\"Interface\\\":\\\"$DNSMASQ_INTERFACE\\\" }}\" | socat - UNIX-SENDTO:" + sock;
            Node.fs.writeFileSync(_this.relay_path, d);
            info("Relay Generated at " + _this.relay_path);
            Node.fs.chmodSync(_this.relay_path, 777);
            info("Relay getting +0777 - wooo");
            var client = unix.createSocket('unix_dgram', _this._onrawdata);
            _this._socketclient = client;
            client.bind(sock);
            Node.fs.chmodSync(sock, 777);
            client.on('error', function (err) {
                error("DNSMASQ ERROR");
                error(err);
            });
            info("DNSMASQ Event Hook Online");
        };
        this._onrawdata = function (buf, rinfo) {
            var data = JSON.parse(buf.toString());
            var lease = data.Lease;
            lease.Mac = lease.Mac.toLowerCase();
            switch (data.Action) {
                case "add":
                    info("Adding " + lease.Hostname + " " + lease.Address);
                    _this.LeaseDB[lease.Mac] = lease;
                    if (_this.WatchList[lease.Mac] !== undefined) {
                        _this.WatchList[lease.Mac](lease);
                    }
                    _this.emit(DHCPLeaseManager.EVENT_ADD, lease);
                    break;
                case "old":
                    if (!_.isEqual(lease, _this.LeaseDB[lease.Mac])) {
                        info("Changing " + lease.Hostname + " " + lease.Address);
                        _this.LeaseDB[lease.Mac] = lease;
                        if (_this.WatchList[lease.Mac] !== undefined) {
                            _this.WatchList[lease.Mac](lease);
                        }
                        _this.emit(DHCPLeaseManager.EVENT_CHANGE, lease);
                    }
                    break;
                case "del":
                    info("Deleting " + lease.Hostname + " " + lease.Address);
                    delete _this.LeaseDB[lease.Mac];
                    if (_this.WatchList[lease.Mac] !== undefined) {
                        _this.WatchList[lease.Mac](undefined);
                    }
                    _this.emit(DHCPLeaseManager.EVENT_DEL, lease);
                    break;
            }
        };
        this.Initialize = function () {
            if (!_this._socketclient) {
                _this.Listen();
            }
        };
    }
    DHCPLeaseManager.prototype.Watch = function (mac, callback) {
        this.WatchList[mac] = callback;
    };
    DHCPLeaseManager.prototype.Unwatch = function (mac) {
        this.WatchList[mac] = undefined;
    };
    DHCPLeaseManager.EVENT_ADD = "add";
    DHCPLeaseManager.EVENT_CHANGE = "change";
    DHCPLeaseManager.EVENT_DEL = "del";
    return DHCPLeaseManager;
})(Node.events.EventEmitter);
exports.DHCPLeaseManager = DHCPLeaseManager;
var ConfigInterface = (function () {
    function ConfigInterface() {
        this.Expand_Hosts = true;
        this.Bogus_Private_Reverse_Lookup = false;
        this.AliasList = [];
        this.Stop_DNS_Rebind = true;
        this.Cache_Size = 4096;
        this.DNS_MultiServer_Query = false;
        this.Addresss = {};
        this.CaptureDomainIntoIpSet = {};
        this.Hosts = {};
        this.Sequential_Ip = true;
        this.Domain = "edge";
    }
    return ConfigInterface;
})();
exports.ConfigInterface = ConfigInterface;
function ConfigToArg(cfg, relay_path) {
    var arrLst = ["-k"];
    arrLst.push("--dhcp-script=" + relay_path);
    arrLst.push("--dhcp-option=46,8");
    arrLst.push("--dhcp-option=6," + cfg.Listen_Address);
    if (cfg.Listen_Address && cfg.Listen_Address != "") {
        arrLst.push("--listen-address=" + cfg.Listen_Address + ",127.0.0.1");
    }
    if (cfg.Bogus_Private_Reverse_Lookup) {
        arrLst.push("-b");
    }
    if (cfg.Expand_Hosts) {
        arrLst.push("--expand-hosts");
    }
    if (cfg.DNS_MultiServer_Query) {
        arrLst.push("--all-servers");
    }
    if (cfg.Stop_DNS_Rebind) {
        arrLst.push("--stop-dns-rebind");
    }
    if (cfg.Sequential_Ip) {
        arrLst.push("--dhcp-sequential-ip");
    }
    if (cfg.Domain && cfg.Domain != "") {
        arrLst.push("--domain=" + cfg.Domain);
    }
    if (cfg.DHCPRange) {
        arrLst.push("--dhcp-range=" + cfg.DHCPRange.Begin + "," + cfg.DHCPRange.End);
    }
    if (cfg.Cache_Size) {
        arrLst.push("--cache-size=" + cfg.Cache_Size);
    }
    if (cfg.AliasList) {
        for (var i = 0; i < cfg.AliasList.length; i++) {
            var a = cfg.AliasList[i];
            if (a.Match && a.NewIp && a.Match.OldIp) {
                arrLst.push("--alias=" + a.Match.OldIp + ((a.Match.End && a.Match.End != "") ? ("-" + a.Match.End + ",") : ",") + a.NewIp + ((a.Mask && a.Mask != "") ? ("," + a.Mask) : ""));
            }
        }
    }
    if (cfg.Addresss) {
        for (var t in cfg.Addresss) {
            if (!cfg.Addresss.hasOwnProperty(t)) {
                continue;
            }
            arrLst.push("--address=/" + t + "/" + cfg.Addresss[t]);
        }
    }
    if (cfg.Hosts) {
        for (var t in cfg.Hosts) {
            if (!cfg.Hosts.hasOwnProperty(t)) {
                continue;
            }
            arrLst.push("--host-record=" + t + "," + cfg.Hosts[t]);
        }
    }
    if (cfg.CaptureDomainIntoIpSet) {
        for (var t in cfg.CaptureDomainIntoIpSet) {
            if (!cfg.CaptureDomainIntoIpSet.hasOwnProperty(t)) {
                continue;
            }
            arrLst.push("--ipset=/" + t + "/" + cfg.CaptureDomainIntoIpSet[t]);
        }
    }
    return arrLst;
}
var dnsmasq = (function (_super) {
    __extends(dnsmasq, _super);
    function dnsmasq() {
        var _this = this;
        _super.call(this, "DNSMASQ");
        this.relay_path = getSock(UUIDstr());
        this.hosts_path = getSock(UUIDstr());
        this.dhcp_host_path = getSock(UUIDstr());
        this.dns_path = getSock(UUIDstr());
        this.Leases = new DHCPLeaseManager(this.relay_path);
        this.Config = new ConfigInterface();
        this.Hosts = [{}, {}];
        this.DNSRules = [[], []];
        this._cache = {};
        this.DHCP_Hosts = [{}, {}];
        this.CheckNameAvailability = function (name, cb, caseSensitive) {
            if (caseSensitive === void 0) { caseSensitive = false; }
            name = (name + "").trim();
            if (!caseSensitive) {
                name = name.toLowerCase();
            }
            forEachFlat(_this.Hosts, function (hosts, flag) {
                if (!hosts)
                    return;
                for (var i in hosts) {
                    if (!caseSensitive) {
                        i = i.toLowerCase();
                    }
                    if (i == name) {
                        flag.stop = true;
                        return cb(false);
                    }
                }
            });
            return cb(true);
        };
        this.flush = function (cb) {
            var changed = false;
            var _hosts = "";
            forEachFlat(_this.Hosts, function (host) {
                if (!host)
                    return;
                for (var t in host) {
                    if (!has(host, t))
                        return;
                    _hosts += host[t] + " " + t;
                    _hosts += "\r\n";
                }
            });
            var _dns = "";
            if (_this.DNSRules) {
                forEachFlat(_this.DNSRules, function (rule) {
                    var c = "";
                    if (rule.Domains && rule.Domains.length > 0) {
                        c += "/";
                        for (var j = 0; j < rule.Domains.length; j++) {
                            c += rule.Domains[j];
                            +"/";
                        }
                    }
                    if (rule.UpStreamDNS && rule.UpStreamDNS != "") {
                        c += rule.UpStreamDNS;
                        if (rule.UpStreamPort) {
                            c += "#" + rule.UpStreamPort;
                        }
                    }
                    else if (c != "") {
                        c += "#";
                    }
                    else {
                        return;
                    }
                    _dns += "server=" + c + "\r\n";
                });
            }
            var _dhcp_hosts = "";
            if (_this.DHCP_Hosts) {
                forEachFlat(_this.DHCP_Hosts, function (hosts) {
                    if (!hosts)
                        return;
                    for (var t in hosts) {
                        if (!hosts.hasOwnProperty(t)) {
                            continue;
                        }
                        _dhcp_hosts += t + "," + hosts[t] + "\r\n";
                    }
                });
            }
            if (!(_this._cache._hosts == _hosts && _this._cache._dns == _dns && _this._cache._dhcp_hosts == _dhcp_hosts)) {
                changed = true;
                _this._cache._hosts = _hosts;
                _this._cache._dns = _dns;
                _this._cache._dhcp_hosts = _dhcp_hosts;
            }
            if (!changed) {
                trace("DNSMASQ found no change, nothing to do :p");
                return cb(undefined, "nochange");
            }
            else {
                trace(_hosts);
                trace(_dns);
                trace(_dhcp_hosts);
            }
            async.series([
                exec.bind(null, "rm -rf " + _this.hosts_path),
                exec.bind(null, "rm -rf " + _this.dns_path),
                exec.bind(null, "rm -rf " + _this.dhcp_host_path),
                Node.fs.writeFile.bind(null, _this.hosts_path, _hosts),
                Node.fs.writeFile.bind(null, _this.dns_path, _dns),
                Node.fs.writeFile.bind(null, _this.dhcp_host_path, _dhcp_hosts)
            ], cb);
        };
        this.SIGHUP_Update = function (cb) {
            setTask("DNSMASQ_sighup", function () {
                intoQueue("DNSMASQ_sighup", function (c) {
                    fatal("Dnsmasq_Hotplug: in progress..");
                    _this.flush(function (err, result) {
                        if (result == "nochange") {
                            return c();
                        }
                        if (_this.Process) {
                            _this.Process.kill("SIGHUP");
                            info("OK");
                        }
                        else {
                            _this.Start(true);
                        }
                        c();
                    });
                }, cb);
            }, 1500);
        };
        this.ApplyChange = function () {
            _this.Stop(true);
        };
    }
    dnsmasq.prototype.Start = function (forever) {
        var _this = this;
        if (forever === void 0) { forever = true; }
        if (!this.IsChoking()) {
            this.Leases.Initialize();
            killall("dnsmasq", function () {
                if (_this.Process) {
                    _this.Process.kill();
                }
                _this.flush(function () {
                    _this.Process = Node.child_process.spawn("dnsmasq", ConfigToArg(_this.Config, _this.relay_path).concat([
                        "--addn-hosts=" + _this.hosts_path,
                        "--dhcp-hostsfile=" + _this.dhcp_host_path,
                        "--servers-file=" + _this.dns_path
                    ]));
                    _super.prototype.Start.call(_this, forever);
                });
            });
        }
    };
    dnsmasq.prototype.OnChoke = function () {
        var _this = this;
        warn("Killing all DNSMASQ processes");
        killall("dnsmasq", function () {
            info("Done, waiting for recall");
            _this.Choke_Timer = setTimeout(function () {
                _this.ClearChoke();
                _this.Start();
            }, 2000);
        });
        return true;
    };
    return dnsmasq;
})(Process);
exports.dnsmasq = dnsmasq;
