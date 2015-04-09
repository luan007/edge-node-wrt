var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var child_process = require("child_process");
var events = require("events");
var Process = require("./Process");
function Exec(tool, cmd, callback) {
    info(tool.bold + " " + cmd);
    child_process.exec("ip " + tool + " " + cmd, function (err, stdout, stderr) {
        callback(err, {
            out: stdout.toString("utf8"),
            err: stderr.toString("utf8")
        });
    });
}
exports.Exec = Exec;
var ipmonitor = (function (_super) {
    __extends(ipmonitor, _super);
    function ipmonitor() {
        var _this = this;
        _super.call(this, "IPMONITOR");
        this.Line_Raw = function (data) {
            if (_this._prev_line_link != undefined) {
                _this.Line_Link(_this._prev_line_link, data);
                _this._prev_line_link = undefined;
                return;
            }
            var tsplit = data.split(']');
            var type = tsplit[0].substr(1);
            var ln = tsplit[1];
            switch (type) {
                case 'NEIGH':
                    _this.Line_Neigh(ln);
                    break;
                case 'LINK':
                    _this._prev_line_link = ln;
                    break;
                case 'ADDR':
                    _this.Line_Addr(ln);
                    break;
            }
        };
        this.Line_Neigh = function (line) {
            if (line.substr(0, 6) == 'delete') {
                ipmonitor.Neigh.emit("SP_CHANGE", line);
            }
            else {
                ipmonitor.Neigh.emit("CHANGE", line);
            }
        };
        this.Line_Link = function (line1, line2) {
            if (line1.substr(0, 7) == 'Deleted') {
                ipmonitor.Link.emit("DELETE", line1.substring(8), line2);
            }
            else {
                ipmonitor.Link.emit("CHANGE", line1, line2);
            }
        };
        this.Line_Addr = function (line) {
            if (line.substr(0, 7) == 'Deleted') {
                ipmonitor.Addr.emit("DELETE", line.substring(8));
            }
            else {
                ipmonitor.Addr.emit("CHANGE", line);
            }
        };
    }
    ipmonitor.prototype.Start = function (forever) {
        if (forever === void 0) { forever = true; }
        if (this.Process) {
            this.Process.kill();
        }
        var p = parsespawn_full("ip", ["monitor", "label"]);
        this.Process = p.process;
        p.event.on("out_line", this.Line_Raw);
        _super.prototype.Start.call(this, forever);
    };
    ipmonitor.Neigh = new events.EventEmitter();
    ipmonitor.Link = new events.EventEmitter();
    ipmonitor.Addr = new events.EventEmitter();
    return ipmonitor;
})(Process);
var addr = (function (_super) {
    __extends(addr, _super);
    function addr() {
        var _this = this;
        _super.call(this);
        this.EVENT_LOAD = "load";
        this.EVENT_LOADEND = "loadend";
        this.EVENT_RECORD_NEW = "new";
        this.EVENT_RECORD_DEL = "del";
        this.Prefix = "addr";
        this.Interfaces = {};
        this.Set_Flush = function (dev, ADDR, callback) {
            if (!_this.Interfaces[dev]) {
                callback(new Error(dev + " does not exist"), { out: "", err: "" });
            }
            else {
                Exec(_this.Prefix, "flush dev " + dev, function () {
                    Exec(_this.Prefix, "add dev " + dev + " " + ADDR.Address + "/" + ADDR.Prefix, callback);
                });
            }
        };
        this.Change = function (dev, addr_before, addr_after, callback) {
            if (!_this.Interfaces[dev]) {
                callback(new Error(dev + " does not exist"), { out: "", err: "" });
            }
            else {
                Exec(_this.Prefix, "del " + addr_before.Address + "/" + addr_before.Prefix + " dev " + dev, function () {
                    Exec(_this.Prefix, "add dev " + dev + " " + addr_after.Address + "/" + addr_after.Prefix, callback);
                });
            }
        };
        this.Add = function (dev, addr, callback) {
            if (!_this.Interfaces[dev]) {
                callback(new Error(dev + " does not exist"), { out: "", err: "" });
            }
            else {
                Exec(_this.Prefix, "add dev " + dev + " " + addr.Address + "/" + addr.Prefix, callback);
            }
        };
        this.Debug_Output = function () {
            info(" +------ ");
            for (var dev in _this.Interfaces) {
                for (var i = 0; i < _this.Interfaces[dev].length; i++) {
                    info(" | " + dev + " ~ " + JSON.stringify(_this.Interfaces[dev][i]));
                }
            }
            info(" +------ ");
        };
        this.OnChange = function (line) {
            var sp = line.split(" ");
            var id = sp[1].split(':')[0];
            if (!_this.Interfaces[id]) {
                _this.Interfaces[id] = [];
            }
            var ifa = sp[6].split('/');
            var index = _this.Interfaces[id].push({
                Address: ifa[0],
                Prefix: ifa[1]
            });
            _this.emit(_this.EVENT_RECORD_NEW, id, index);
        };
        this.OnDelete = function (line) {
            var sp = line.split(" ");
            var id = sp[1].split(':')[0];
            if (!_this.Interfaces[id]) {
                return;
            }
            else {
                var ifa = sp[6].split('/');
                var n = [];
                for (var i = 0; i < _this.Interfaces[id].length; i++) {
                    if (_this.Interfaces[id][i].Address !== ifa[0] && _this.Interfaces[id][i].Prefix !== ifa[1]) {
                        n.push(_this.Interfaces[id][i]);
                    }
                }
                _this.emit(_this.EVENT_RECORD_DEL, id);
                _this.Interfaces[id] = n;
                _this.Debug_Output();
                return;
            }
        };
        this.Load = function (callback) {
            _this.Interfaces = {};
            _this.emit(_this.EVENT_LOAD);
            Exec(_this.Prefix, "show", function (err, result) {
                if (!err && result.out) {
                    var lines = result.out.trim().split('\n');
                    var _interface;
                    for (var i = 0; i < lines.length; i++) {
                        if (lines[i].charAt(0) != " ") {
                            _interface = lines[i].split(':')[1].trim();
                            _this.Interfaces[_interface] = [];
                        }
                        else {
                            var ln = lines[i].trim();
                            if (ln.substr(0, 4) == "inet") {
                                var a = ln.split(' ')[1].split('/');
                                _this.Interfaces[_interface].push({
                                    Prefix: a[1],
                                    Address: a[0]
                                });
                            }
                        }
                        _this.emit(_this.EVENT_RECORD_NEW, _interface);
                    }
                }
                callback(err, result);
                _this.Debug_Output();
                _this.emit(_this.EVENT_LOADEND, _this.Interfaces);
            });
        };
        ipmonitor.Addr.on("CHANGE", this.OnChange);
        ipmonitor.Addr.on("DELETE", this.OnDelete);
        trace("Initialize");
        addr.Instance = this;
    }
    addr.prototype.Get = function (dev) {
        return this.Interfaces[dev];
    };
    return addr;
})(events.EventEmitter);
var neigh = (function (_super) {
    __extends(neigh, _super);
    function neigh() {
        var _this = this;
        _super.call(this);
        this.WatchList = {};
        this.EVENT_LOAD = "load";
        this.EVENT_LOADEND = "loadend";
        this.EVENT_RECORD_NEW = "new";
        this.EVENT_RECORD_CHANGE = "change";
        this.EVENT_RECORD_DEL = "del";
        this.MacList = {};
        this.IpList = {};
        this.Prefix = "neigh";
        this.Delete = function (n, callback) {
            var cmd = "del " + NeighRecord.toCommandString(n);
            Exec(_this.Prefix, cmd, callback);
        };
        this.Add = function (n, callback) {
            var cmd = "add " + NeighRecord.toCommandString(n);
            Exec(_this.Prefix, cmd, callback);
        };
        this.Update = function (n, callback) {
            var cmd = "replace " + NeighRecord.toCommandString(n);
            Exec(_this.Prefix, cmd, callback);
        };
        this.Load = function (callback) {
            _this.MacList = {};
            _this.emit(_this.EVENT_LOAD);
            Exec(_this.Prefix, "show", function (err, result) {
                if (!err && result.out) {
                    var lines = result.out.toLowerCase().trim().split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        var n = (NeighRecord.FromLine(lines[i]));
                        if (n && !NeighRecord.IsDead(n)) {
                            _this.MacList[n.Mac] = n;
                        }
                    }
                }
                callback(err, result);
                _this.emit(_this.EVENT_LOADEND, _this.MacList);
            });
        };
        this.SweepDead = function () {
            for (var mac in _this.MacList) {
                if (NeighRecord.IsDead(_this.MacList[mac])) {
                    _this.emit(_this.EVENT_RECORD_DEL, _this.MacList[mac]);
                    delete _this.MacList[mac];
                }
            }
        };
        this.Debug_Output = function () {
            info(" +------ ");
            for (var mac in _this.MacList) {
                info(" | " + NeighRecord.toCommandString(_this.MacList[mac]));
            }
            info(" +------ ");
        };
        this.OnChange = function (line) {
            var n = new NeighRecord();
            NeighRecord.Apply(n, line);
            if (NeighRecord.IsDead(n)) {
                for (var mac in _this.MacList) {
                    if (_this.MacList[mac].Address == n.Address) {
                        delete _this.IpList[n.Address];
                        _this.emit(_this.EVENT_RECORD_DEL, _this.MacList[mac]);
                        if (_this.WatchList[mac]) {
                            warn("Check if we can add DEV filter here");
                            _this.WatchList[mac].func(n);
                        }
                        delete _this.MacList[mac];
                    }
                }
            }
            else if (_this.MacList[n.Mac]) {
                var cur = _this.MacList[n.Mac];
                if (_this.WatchList[n.Mac] && (_this.WatchList[n.Mac].dev == undefined || _this.WatchList[n.Mac].dev == n.Dev)) {
                    var next = n;
                    if (NeighRecord.IsAlive(cur) != NeighRecord.IsAlive(next) && cur.Address != next.Address) {
                        _this.WatchList[n.Mac].func(n);
                    }
                }
                _this.IpList[n.Address] = n;
                _this.MacList[n.Mac] = n;
                _this.emit(_this.EVENT_RECORD_CHANGE, _this.MacList[n.Mac], cur);
            }
            else if (!_this.MacList[n.Mac]) {
                _this.MacList[n.Mac] = n;
                _this.IpList[n.Address] = n;
                _this.emit(_this.EVENT_RECORD_NEW, _this.MacList[n.Mac]);
                if (_this.WatchList[n.Mac] && (_this.WatchList[n.Mac].dev == undefined || _this.WatchList[n.Mac].dev == n.Dev)) {
                    _this.WatchList[n.Mac].func(n);
                }
            }
        };
        ipmonitor.Neigh.on("CHANGE", this.OnChange);
        info("Initialize");
        neigh.Instance = this;
    }
    neigh.prototype.Exist = function (mac) {
        return this.Get(mac) != undefined;
    };
    neigh.prototype.Get = function (mac) {
        return this.MacList[mac];
    };
    neigh.prototype.Watch = function (mac, callback) {
        this.WatchList[mac] = {
            func: callback,
            dev: undefined
        };
    };
    neigh.prototype.WatchWithDev = function (dev, mac, callback) {
        this.WatchList[mac] = {
            func: callback,
            dev: dev
        };
    };
    neigh.prototype.Unwatch = function (mac) {
        delete this.WatchList[mac];
    };
    neigh.prototype.GetByAddress_Array = function (addr) {
        var t = [];
        for (var mac in this.MacList) {
            if (this.MacList[mac].Address == addr) {
                t.push(this.MacList[mac]);
            }
        }
        return t;
    };
    neigh.prototype.GetByAddress_First = function (addr) {
        return this.IpList[addr];
    };
    neigh.prototype.GetByAddress_First_ActiveProbe = function (addr, callback) {
        var _this = this;
        var ping = child_process.spawn("ping", ["-c", "3", addr]);
        ping.on('close', function () {
            callback(undefined, _this.IpList[addr]);
        });
    };
    neigh.prototype.GetByAddress = function (addr) {
        var result;
        for (var mac in this.MacList) {
            if (this.MacList[mac].Address == addr) {
                if (result && !Array.isArray(result)) {
                    var t = [];
                    t.push(result);
                    result = t;
                }
                if (Array.isArray(result)) {
                    t.push(this.MacList[mac]);
                }
                else {
                    result = this.MacList[mac];
                }
            }
        }
        return result;
    };
    return neigh;
})(events.EventEmitter);
var NeighRecord = (function () {
    function NeighRecord() {
    }
    NeighRecord.IsAlive = function (record) {
        return (record.NUD & NeighRecord.MASK_ALIVE) > 0;
    };
    NeighRecord.IsDead = function (record) {
        return (record.NUD & NeighRecord.MASK_DEAD) > 0;
    };
    NeighRecord.IsUndetermined = function (record) {
        return (record.NUD & NeighRecord.MASK_UNDETERMINED) > 0;
    };
    NeighRecord.FromLine = function (line) {
        var l = line.toLowerCase().split(' ');
        if (l.length < 4)
            return undefined;
        else {
            var nei = new NeighRecord();
            NeighRecord.Apply(nei, line);
            return nei;
        }
    };
    NeighRecord.Apply = function (record, line) {
        var l = line.toLowerCase().split(' ');
        if (l.length < 4)
            return undefined;
        else {
            var nei = record;
            nei.Address = l[0];
            for (var i = 1; i < l.length - 1; i++) {
                switch (l[i]) {
                    case 'dev':
                        nei.Dev = l[i + 1];
                        break;
                    case 'lladdr':
                        nei.Mac = l[i + 1];
                        break;
                }
            }
            switch (l[l.length - 1]) {
                case 'none':
                    nei.NUD = NUDState.NONE;
                    break;
                case 'incomplete':
                    nei.NUD = NUDState.INCOMPLETE;
                    break;
                case 'reachable':
                    nei.NUD = NUDState.REACHABLE;
                    break;
                case 'stale':
                    nei.NUD = NUDState.STALE;
                    break;
                case 'delay':
                    nei.NUD = NUDState.DELAY;
                    break;
                case 'probe':
                    nei.NUD = NUDState.PROBE;
                    break;
                case 'failed':
                    nei.NUD = NUDState.FAILED;
                    break;
                case 'noarp':
                    nei.NUD = NUDState.NOARP;
                    break;
                case 'permanent':
                    nei.NUD = NUDState.PERMANENT;
                    break;
            }
        }
        return this;
    };
    NeighRecord.toCommandString = function (neigh) {
        var result = neigh.Address;
        if (neigh.Dev) {
            result += " dev " + neigh.Dev;
        }
        if (neigh.Mac) {
            result += " lladdr " + neigh.Mac;
        }
        return result;
    };
    NeighRecord.MASK_ALIVE = 1 << 4;
    NeighRecord.MASK_DEAD = 1 << 5;
    NeighRecord.MASK_UNDETERMINED = 1 << 6;
    return NeighRecord;
})();
exports.NeighRecord = NeighRecord;
(function (NUDState) {
    NUDState[NUDState["NONE"] = 0 | NeighRecord.MASK_DEAD] = "NONE";
    NUDState[NUDState["INCOMPLETE"] = 0 | NeighRecord.MASK_UNDETERMINED] = "INCOMPLETE";
    NUDState[NUDState["REACHABLE"] = 0 | NeighRecord.MASK_ALIVE] = "REACHABLE";
    NUDState[NUDState["STALE"] = 1 | NeighRecord.MASK_ALIVE] = "STALE";
    NUDState[NUDState["DELAY"] = 2 | NeighRecord.MASK_ALIVE] = "DELAY";
    NUDState[NUDState["PROBE"] = 1 | NeighRecord.MASK_UNDETERMINED] = "PROBE";
    NUDState[NUDState["FAILED"] = 1 | NeighRecord.MASK_DEAD] = "FAILED";
    NUDState[NUDState["NOARP"] = 3 | NeighRecord.MASK_ALIVE] = "NOARP";
    NUDState[NUDState["PERMANENT"] = 2 | NeighRecord.MASK_UNDETERMINED] = "PERMANENT";
})(exports.NUDState || (exports.NUDState = {}));
var NUDState = exports.NUDState;
var link = (function (_super) {
    __extends(link, _super);
    function link() {
        var _this = this;
        _super.call(this);
        this.EVENT_LOAD = "load";
        this.EVENT_LOADEND = "loadend";
        this.EVENT_RECORD_NEW = "new";
        this.EVENT_RECORD_CHANGE = "change";
        this.EVENT_RECORD_DEL = "del";
        this.Prefix = "link";
        this.Interfaces = {};
        this.Add = function (link, callback) {
            warn("!NOT IMPLEMENTED - VLAN SUPPORT!");
        };
        this.Power = function (dev, power, callback) {
            if (!_this.Interfaces[dev]) {
                callback(new Error(dev + " does not exist"), { out: "", err: "" });
            }
            else {
                Exec(_this.Prefix, "set " + dev + " " + (power ? "up" : "down"), callback);
            }
        };
        this.Debug_Output = function () {
            trace(" +------ ");
            for (var dev in _this.Interfaces) {
                trace(" | " + dev + " ~ " + JSON.stringify(_this.Interfaces[dev].Status));
            }
            trace(" +------ ");
        };
        this.OnChange = function (line, line2) {
            var id = line.split(":")[0];
            for (var i in _this.Interfaces) {
                if (_this.Interfaces[i].Id == id) {
                    _this.Interfaces[i].Apply(line, line2);
                    _this.emit(_this.EVENT_RECORD_CHANGE, i, _this.Interfaces[i]);
                    return;
                }
            }
            var p = new LinkInterface();
            p.Apply(line, line2);
            _this.Interfaces[p.Dev] = p;
            _this.emit(_this.EVENT_RECORD_NEW, p);
        };
        this.OnDelete = function (line, line2) {
            var id = line.split(":")[0];
            for (var i in _this.Interfaces) {
                if (_this.Interfaces[i].Id == id) {
                    var cache = _this.Interfaces[i];
                    cache.Apply(line, line2);
                    delete _this.Interfaces[i];
                    _this.emit(_this.EVENT_RECORD_DEL, i, cache);
                    return;
                }
            }
        };
        this.Load = function (callback) {
            _this.Interfaces = {};
            _this.emit(_this.EVENT_LOAD);
            Exec(_this.Prefix, "show", function (err, result) {
                if (!err && result.out) {
                    var lines = result.out.trim().split('\n');
                    for (var i = 0; i < lines.length; i += 2) {
                        var t = new LinkInterface();
                        t.Apply(lines[i], lines[i + 1]);
                        _this.Interfaces[t.Dev] = t;
                        _this.emit(_this.EVENT_RECORD_NEW);
                    }
                }
                callback(err, result);
                _this.Debug_Output();
                _this.emit(_this.EVENT_LOADEND, _this.Interfaces);
            });
        };
        ipmonitor.Link.on("CHANGE", this.OnChange);
        ipmonitor.Link.on("DELETE", this.OnDelete);
        trace("Initialize");
        link.Instance = this;
    }
    link.prototype.Get = function (dev) {
        return this.Interfaces[dev];
    };
    return link;
})(events.EventEmitter);
var LinkInterface = (function () {
    function LinkInterface() {
        var _this = this;
        this.Status = {};
        this.IsUp = function () {
            return _this.Status["UP"] !== undefined;
        };
    }
    LinkInterface.prototype.Apply = function (line1, line2) {
        var l = line1.split(' ');
        var l2 = line2.trim().split(' ');
        if (l.length < 3 || l2.length < 4)
            return undefined;
        else {
            this.Id = l[0].substring(0, l[0].length - 1);
            this.Dev = l[1].substring(0, l[1].length - 1);
            var statuses = l[2].substring(1, l[2].length - 1).split(',');
            this.Status = {};
            for (var i = 0; i < statuses.length; i++) {
                this.Status[statuses[i]] = 1;
            }
            for (var i = 3; i < l.length; i++) {
                switch (l[i]) {
                    case 'state':
                        i++;
                        this.State = l[i];
                        break;
                }
            }
            for (var i = 0; i < l2.length; i++) {
                switch (l2[i]) {
                    case 'link/ether':
                        i++;
                        this.Mac = l2[i];
                        break;
                    case 'brd':
                        i++;
                        this.MacMask = l2[i];
                        break;
                }
            }
        }
        return this;
    };
    return LinkInterface;
})();
exports.LinkInterface = LinkInterface;
exports.Addr;
exports.Link;
exports.Neigh;
function Initialize(cb) {
    trace("Initializing");
    exports.Addr = new addr();
    exports.Link = new link();
    exports.Neigh = new neigh();
    async.series([
        addr.Instance.Load,
        neigh.Instance.Load,
        link.Instance.Load
    ], function () {
        ipmonitor.Instance = new ipmonitor();
        ipmonitor.Instance.Start(true);
        cb();
    });
}
exports.Initialize = Initialize;
