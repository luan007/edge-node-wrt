var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var child_process = require("child_process");
var spawn = child_process.spawn;
var exec = child_process.exec;
exports.Sets = {};
function Initialize(callback) {
    info("Initializing");
    RawCommand("x", "", function () {
        trace("UP".bold);
        callback();
    });
}
exports.Initialize = Initialize;
function RawCommand(command, arg, callback) {
    info("COMMAND > " + command + " " + arg);
    exec("ipset " + command + " " + arg, function (err, stdout, stderr) {
        if (!stderr || stderr.toString() == "") {
            callback(undefined, stdout.toString());
        }
        else {
            callback(new Error(stderr.toString()), stdout.toString());
        }
    });
}
exports.RawCommand = RawCommand;
var SetItemBase = (function () {
    function SetItemBase() {
    }
    SetItemBase.prototype.toOptionString = function () {
        var opt = "";
        if (this.timeout !== undefined && this.timeout.trim() !== "") {
            opt += " timeout " + this.timeout;
        }
        if (this.packets !== undefined && this.packets.trim() !== "") {
            opt += " packets " + this.packets;
        }
        if (this.bytes !== undefined && this.bytes.trim() !== "") {
            opt += " bytes " + this.bytes;
        }
        if (this.nomatch !== undefined && this.nomatch.trim() !== "") {
            opt += " nomatch";
        }
        return opt;
    };
    return SetItemBase;
})();
exports.SetItemBase = SetItemBase;
var SetBase = (function () {
    function SetBase(SetType, Name, Opt, Timeout, Counter) {
        if (Timeout === void 0) { Timeout = false; }
        if (Counter === void 0) { Counter = true; }
        this.SetType = SetType;
        this.Name = Name;
        this.Opt = Opt;
        this.Timeout = Timeout;
        this.Counter = Counter;
        this.List = {};
        if (exports.Sets[Name]) {
            throw new Error("Set Exists");
        }
        var OPT = "";
        OPT += Timeout ? " timeout 0" : "";
        OPT += Counter ? " counters" : "";
        RawCommand("create", this.Name + " " + this.SetType + " " + Opt + " " + OPT, function (err) {
        });
        exports.Sets[Name] = this;
    }
    SetBase.prototype.Add = function (item, callback) {
        var _this = this;
        if (this.List[item.toOptionString()]) {
            return callback(new Error("ITEM EXISTS!"), item);
        }
        RawCommand("add " + this.Name, item.toOptionString(), function (err, data) {
            _this.List[item.toOptionString()] = item;
            return callback(err, data);
        });
    };
    SetBase.prototype.Delete = function (item, callback) {
        var _this = this;
        if (!this.List[item.toOptionString()]) {
            return callback(new Error("ITEM DOES NOT EXIST"), item);
        }
        RawCommand("del " + this.Name, item.toOptionString(), function (err, data) {
            delete _this.List[item.toOptionString()];
            callback(err, data);
        });
    };
    SetBase.prototype.Destroy = function (callback) {
        var _this = this;
        RawCommand("x", this.Name, function (err, data) {
            if (!err) {
                delete exports.Sets[_this.Name];
            }
        });
    };
    return SetBase;
})();
exports.SetBase = SetBase;
var BitmapIp_SetItem = (function (_super) {
    __extends(BitmapIp_SetItem, _super);
    function BitmapIp_SetItem() {
        _super.apply(this, arguments);
        this.ip = "";
        this.fromIp_toIp = "";
        this.ip_cidr = "";
    }
    BitmapIp_SetItem.prototype.toOptionString = function () {
        return this.ip + this.fromIp_toIp + this.ip_cidr + _super.prototype.toOptionString.call(this);
    };
    return BitmapIp_SetItem;
})(SetItemBase);
exports.BitmapIp_SetItem = BitmapIp_SetItem;
var BitmapIp_Set = (function (_super) {
    __extends(BitmapIp_Set, _super);
    function BitmapIp_Set() {
        _super.apply(this, arguments);
        this.Range = "";
        this.Mask = "";
    }
    BitmapIp_Set.Create = function (name, range, netmask, timeout, counter) {
        if (timeout === void 0) { timeout = false; }
        if (counter === void 0) { counter = true; }
        var option = "range " + range;
        if (netmask && netmask.trim() !== "") {
            option += " netmask " + netmask;
        }
        var SET = new BitmapIp_Set(BitmapIp_Set.SETTYPE, name, option, timeout, counter);
        SET.Range = range;
        SET.Mask = netmask;
        return SET;
    };
    BitmapIp_Set.SETTYPE = "bitmap:ip";
    return BitmapIp_Set;
})(SetBase);
exports.BitmapIp_Set = BitmapIp_Set;
var BitmapIpMac_SetItem = (function (_super) {
    __extends(BitmapIpMac_SetItem, _super);
    function BitmapIpMac_SetItem() {
        _super.apply(this, arguments);
        this.ip = "";
        this.mac = "";
    }
    BitmapIpMac_SetItem.prototype.toOptionString = function () {
        return this.ip + (this.mac ? (":" + this.mac) : "") + _super.prototype.toOptionString.call(this);
    };
    return BitmapIpMac_SetItem;
})(SetItemBase);
exports.BitmapIpMac_SetItem = BitmapIpMac_SetItem;
var BitmapIpMac_Set = (function (_super) {
    __extends(BitmapIpMac_Set, _super);
    function BitmapIpMac_Set() {
        _super.apply(this, arguments);
        this.Range = "";
    }
    BitmapIpMac_Set.Create = function (name, range, timeout, counter) {
        if (timeout === void 0) { timeout = false; }
        if (counter === void 0) { counter = true; }
        var option = "range " + range;
        var SET = new BitmapIpMac_Set(BitmapIpMac_Set.SETTYPE, name, option, timeout, counter);
        SET.Range = range;
        return SET;
    };
    BitmapIpMac_Set.SETTYPE = "bitmap:ip,mac";
    return BitmapIpMac_Set;
})(SetBase);
exports.BitmapIpMac_Set = BitmapIpMac_Set;
var BitmapPort_SetItem = (function (_super) {
    __extends(BitmapPort_SetItem, _super);
    function BitmapPort_SetItem() {
        _super.apply(this, arguments);
        this.port = "";
        this.portRange = "";
    }
    BitmapPort_SetItem.prototype.toOptionString = function () {
        return (this.port ? this.port : this.portRange) + _super.prototype.toOptionString.call(this);
    };
    return BitmapPort_SetItem;
})(SetItemBase);
exports.BitmapPort_SetItem = BitmapPort_SetItem;
var BitmapPort_Set = (function (_super) {
    __extends(BitmapPort_Set, _super);
    function BitmapPort_Set() {
        _super.apply(this, arguments);
        this.fromPort = "";
        this.toPort = "";
    }
    BitmapPort_Set.Create = function (name, fromPort, toPort, timeout, counter) {
        if (timeout === void 0) { timeout = false; }
        if (counter === void 0) { counter = true; }
        var option = "range " + fromPort + "-" + toPort;
        var SET = new BitmapPort_Set(BitmapPort_Set.SETTYPE, name, option, timeout, counter);
        SET.fromPort = fromPort;
        SET.toPort = toPort;
        return SET;
    };
    BitmapPort_Set.SETTYPE = "bitmap:port";
    return BitmapPort_Set;
})(SetBase);
exports.BitmapPort_Set = BitmapPort_Set;
var HashIp_SetItem = (function (_super) {
    __extends(HashIp_SetItem, _super);
    function HashIp_SetItem() {
        _super.apply(this, arguments);
        this.ip = "";
        this.fromIp_toIp = "";
        this.ip_cidr = "";
    }
    HashIp_SetItem.prototype.toOptionString = function () {
        return this.ip + this.fromIp_toIp + this.ip_cidr + _super.prototype.toOptionString.call(this);
    };
    return HashIp_SetItem;
})(SetItemBase);
exports.HashIp_SetItem = HashIp_SetItem;
var HashIp_Set = (function (_super) {
    __extends(HashIp_Set, _super);
    function HashIp_Set() {
        _super.apply(this, arguments);
        this.Mask = "";
    }
    HashIp_Set.Create = function (name, mask, timeout, counter) {
        if (timeout === void 0) { timeout = false; }
        if (counter === void 0) { counter = true; }
        var option = "netmask " + mask;
        var SET = new HashIp_Set(HashIp_Set.SETTYPE, name, option, timeout, counter);
        SET.Mask = mask;
        return SET;
    };
    HashIp_Set.SETTYPE = "hash:ip";
    return HashIp_Set;
})(SetBase);
exports.HashIp_Set = HashIp_Set;
var HashNet_SetItem = (function (_super) {
    __extends(HashNet_SetItem, _super);
    function HashNet_SetItem() {
        _super.apply(this, arguments);
        this.fromIp_toIp = "";
        this.ip_cidr = "";
    }
    HashNet_SetItem.prototype.toOptionString = function () {
        return this.fromIp_toIp + this.ip_cidr + _super.prototype.toOptionString.call(this);
    };
    return HashNet_SetItem;
})(SetItemBase);
exports.HashNet_SetItem = HashNet_SetItem;
var HashNet_Set = (function (_super) {
    __extends(HashNet_Set, _super);
    function HashNet_Set() {
        _super.apply(this, arguments);
    }
    HashNet_Set.Create = function (name, timeout, counter) {
        if (timeout === void 0) { timeout = false; }
        if (counter === void 0) { counter = true; }
        var SET = new HashNet_Set(HashNet_Set.SETTYPE, name, "", timeout, counter);
        return SET;
    };
    HashNet_Set.SETTYPE = "hash:net";
    return HashNet_Set;
})(SetBase);
exports.HashNet_Set = HashNet_Set;
