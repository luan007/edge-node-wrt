var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var child_process = require("child_process");
var spawn = child_process.spawn;
var events = require("events");
var _name = "Iptables";
(function (TABLE_TYPE) {
    TABLE_TYPE[TABLE_TYPE["FILTER"] = 0] = "FILTER";
    TABLE_TYPE[TABLE_TYPE["NAT"] = 1] = "NAT";
    TABLE_TYPE[TABLE_TYPE["MANGLE"] = 2] = "MANGLE";
})(exports.TABLE_TYPE || (exports.TABLE_TYPE = {}));
var TABLE_TYPE = exports.TABLE_TYPE;
(function (CHAIN_TYPE) {
    CHAIN_TYPE[CHAIN_TYPE["PREROUTING"] = 0] = "PREROUTING";
    CHAIN_TYPE[CHAIN_TYPE["FORWARD"] = 1] = "FORWARD";
    CHAIN_TYPE[CHAIN_TYPE["INPUT"] = 2] = "INPUT";
    CHAIN_TYPE[CHAIN_TYPE["OUTPUT"] = 3] = "OUTPUT";
    CHAIN_TYPE[CHAIN_TYPE["POSTROUTING"] = 4] = "POSTROUTING";
    CHAIN_TYPE[CHAIN_TYPE["USER"] = 10000] = "USER";
})(exports.CHAIN_TYPE || (exports.CHAIN_TYPE = {}));
var CHAIN_TYPE = exports.CHAIN_TYPE;
(function (POLICY_TYPE) {
    POLICY_TYPE[POLICY_TYPE["ACCEPT"] = 0] = "ACCEPT";
    POLICY_TYPE[POLICY_TYPE["DROP"] = 1] = "DROP";
})(exports.POLICY_TYPE || (exports.POLICY_TYPE = {}));
var POLICY_TYPE = exports.POLICY_TYPE;
var Table = (function () {
    function Table() {
        var _this = this;
        this.Exec = "iptables";
        this.Chains = {};
        this.AddChain = function (chain, cb) {
            if (chain.IsUserDefined()) {
                _this.RawRuleCmd("-N " + chain.Name, function (err) {
                    _this.Chains[chain.Name] = chain;
                    cb(err);
                });
            }
            else {
                _this.Chains[chain.Name] = chain;
            }
        };
        this.Name = function () {
            switch (_this.Type()) {
                case 0 /* FILTER */:
                    return "filter";
                case 1 /* NAT */:
                    return "nat";
                case 2 /* MANGLE */:
                    return "mangle";
            }
        };
        this.Load = function (loaded) {
            _this.RawRuleCmd("-F", function () {
                _this.RawRuleCmd("-X", function () {
                    _this._guard_Timer = setTimeout(_this._guard, 3000);
                    loaded(null, _this);
                });
            });
        };
        this._changeVal = 1;
        this._lastDelta = 0;
        this._lastMeasure = 0;
        this._guard = function () {
            clearTimeout(_this._guard_Timer);
            var dateA = new Date().getTime();
            if (CONF.IS_DEBUG && CONF.IPTABLES_GUARD_LOG) {
                info(_this.Exec + " " + _this.Name() + " _GUARD");
            }
            var parser = parsespawn(_this.Exec, ["-t", _this.Name(), "-vnxL", "--line-number"]);
            var curchain = undefined;
            var change = -3;
            var deltaA = 0;
            parser.on("out_line", function (line) {
                var ln = (line + "").trim();
                if (ln[0] == "C") {
                    var chain = ln.split(" ")[1];
                    if (_this.Chains[chain] !== undefined) {
                        curchain = _this.Chains[chain];
                        var b = parseInt(ln.split(" ")[6]);
                        var p = parseInt(ln.split(" ")[4]);
                        var deltaB = Math.abs(b - curchain.Bytes);
                        deltaA += deltaB;
                        if (deltaB !== 0 || p !== curchain.Packets) {
                            curchain.Delta_Bytes = b - curchain.Bytes;
                            curchain.Delta_Packets = p - curchain.Packets;
                            curchain.Delta_Time = new Date().getTime() - curchain.LastMeasure;
                            curchain.LastMeasure = new Date().getTime();
                            var old_B = curchain.Bytes;
                            var old_P = curchain.Packets;
                            curchain.Bytes = b;
                            curchain.Packets = p;
                            process.nextTick(function () {
                                curchain.emit("traffic", curchain, b, old_B, p, old_P, curchain.Delta_Time);
                            });
                        }
                    }
                }
                else if (ln[0] == "n") {
                }
                else if (curchain && ln != "") {
                    var contents = ln.split(/\s+/);
                    var num = parseInt(contents[0]);
                    var pkgs = parseInt(contents[1]);
                    var bytes = parseInt(contents[2]);
                    var g = curchain.Get(num - 1);
                    if (g) {
                        if (g.Count_Bytes !== bytes || g.Count_Packets !== pkgs) {
                            var oldB = g.Count_Bytes;
                            var oldP = g.Count_Packets;
                            g.Delta_Bytes = bytes - g.Count_Bytes;
                            g.Delta_Packets = pkgs - g.Count_Packets;
                            g.Delta_Time = new Date().getTime() - g.LastMeasure;
                            g.Count_Bytes = bytes;
                            g.Count_Packets = pkgs;
                            g.LastMeasure = new Date().getTime();
                            process.nextTick(function () {
                                g.emit("traffic", g, bytes, oldB, pkgs, oldP, g.Delta_Time);
                            });
                        }
                    }
                }
            });
            parser.on("err_line", function (line) {
                error(new Error(line), "");
            });
            parser.once("exit", function () {
                parser.removeAllListeners();
                var dateB = new Date().getTime();
                var deltaT = (dateB - _this._lastMeasure) / 1000;
                deltaA /= deltaT;
                var a = Math.abs(_this._lastDelta - deltaA);
                if (a > 10000) {
                    if (a < 30000) {
                        change = 0;
                    }
                    else if (a < 150000) {
                        change = 0.5;
                    }
                    else if (a < 300000) {
                        change = 1;
                    }
                    else if (a < 1000000) {
                        change = 2;
                    }
                    else if (a < 3000000) {
                        change = 4;
                    }
                    else if (a < 10000000) {
                        change = 6;
                    }
                    else {
                        change = 10;
                    }
                }
                _this._lastDelta = deltaA;
                _this._changeVal += change;
                _this._changeVal = Math.max(1, _this._changeVal);
                _this._changeVal = Math.min(10, _this._changeVal);
                var span = dateB - dateA;
                var nextloop = span * 500;
                nextloop = Math.max(5000, nextloop);
                nextloop = Math.min(15000, nextloop);
                nextloop /= _this._changeVal;
                _this._lastMeasure = new Date().getTime();
                _this._guard_Timer = setTimeout(_this._guard, nextloop);
            });
        };
        this.RawRuleCmd = function (command, callback) {
            exec(_this.Exec + " -w -t " + _this.Name() + " " + command, function (err, stdout, stderr) {
                callback(err, {
                    out: stdout,
                    err: stderr
                });
            });
        };
    }
    Table.prototype.Type = function () {
        return 0 /* FILTER */;
    };
    Table.prototype.SetPolicy = function (chain_t, policy, callback) {
        var chain = Table.ChainTypeToString(chain_t);
        if (!chain) {
            return;
        }
        var target = "ACCEPT";
        switch (policy) {
            case 1 /* DROP */:
                target = "DROP";
                break;
        }
        this.RawRuleCmd("-P " + chain + " " + target, callback);
    };
    Table.ChainTypeToString = function (chain_t) {
        switch (chain_t) {
            case 1 /* FORWARD */:
                return "FORWARD";
            case 2 /* INPUT */:
                return "INPUT";
            case 3 /* OUTPUT */:
                return "OUTPUT";
            case 4 /* POSTROUTING */:
                return "POSTROUTING";
            case 0 /* PREROUTING */:
                return "PREROUTING";
            default:
                return undefined;
        }
    };
    return Table;
})();
exports.Table = Table;
var Chain = (function (_super) {
    __extends(Chain, _super);
    function Chain(name, table, type) {
        var _this = this;
        if (type === void 0) { type = 10000 /* USER */; }
        _super.call(this);
        this.Packets = 0;
        this.Bytes = 0;
        this.Delta_Bytes = 0;
        this.Delta_Packets = 0;
        this.Delta_Time = 0;
        this.Name = "";
        this.Type = 10000 /* USER */;
        this.Rules = [];
        this.Table = null;
        this.LastMeasure = 0;
        this.IsUserDefined = function () {
            return _this.Type === 10000 /* USER */;
        };
        this.Add = function (rule, callback) {
            if (rule.Index == -1) {
                rule.Chain = _this;
                var str = rule.toString();
                _this.RawChainCommand("-A", str, function (err, data) {
                    if (data.err.length > 0) {
                        error(new Error(data.err), "");
                        callback(new Error(data.err), undefined);
                    }
                    else {
                        _this.Rules.push(rule);
                        rule.Index = _this.Rules.length - 1;
                        callback(null, rule);
                    }
                });
            }
            else {
                return callback(new Error("Rule Exists"), null);
            }
        };
        this.Get = function (index) {
            return _this.Rules[index];
        };
        this.Remove = function (index, callback) {
            if (_this.Rules.length - 1 <= index) {
                return callback(new Error("index out of range"), undefined);
            }
            _this.RawChainCommand("-D", (index + 1) + "", function (err, data) {
                if (data.err.length > 0) {
                    error(new Error(data.err), "");
                    callback(new Error(data.err), undefined);
                }
                else {
                    var rule = _this.Rules[index];
                    rule.Index = -1;
                    _this.Rules = _this.Rules.splice(index, 1);
                    for (var i = index; i < _this.Rules.length; i++) {
                        _this.Rules[i].Index = i;
                    }
                    callback(null, null);
                }
            });
        };
        this.Update = function (rule_with_index, callback) {
            _this.RawChainCommand("-R", (rule_with_index.Index + 1) + " " + rule_with_index.toString(), function (err, data) {
                if (data.err.length > 0) {
                    error(new Error(data.err), "");
                    callback(new Error(data.err), undefined);
                }
                else {
                    callback(null, rule_with_index);
                }
            });
        };
        this.Insert = function (index, rule, callback) {
            var _i = index;
            if (index >= _this.Rules.length) {
                _i = _this.Rules.length - 1;
            }
            _i += 1;
            var str = rule.toString();
            rule.Chain = _this;
            _this.RawChainCommand("-I", _i + " " + str, function (err, data) {
                if (data.err.length > 0) {
                    error(new Error(data.err), "");
                    callback(new Error(data.err), undefined);
                }
                else {
                    _this.Rules = _this.Rules.splice(_i - 1, 0, rule);
                    rule.Index = _i - 1;
                    for (var i = _i; i < _this.Rules.length; i++) {
                        _this.Rules[i].Index = i;
                    }
                    callback(null, rule);
                }
            });
        };
        this.Size = function () {
            return _this.Rules.length;
        };
        this.RawChainCommand = function (action, param, callback) {
            _this.Table.RawRuleCmd(action + " " + _this.Name + " " + param, callback);
        };
        this.Name = name;
        this.Type = type;
        this.Table = table;
    }
    return Chain;
})(events.EventEmitter);
exports.Chain = Chain;
var FilterTable = (function (_super) {
    __extends(FilterTable, _super);
    function FilterTable() {
        _super.call(this);
        this.FORWARD = new Chain("FORWARD", this, 1 /* FORWARD */);
        this.INPUT = new Chain("INPUT", this, 2 /* INPUT */);
        this.OUTPUT = new Chain("OUTPUT", this, 3 /* OUTPUT */);
        this.AddChain(this.FORWARD);
        this.AddChain(this.INPUT);
        this.AddChain(this.OUTPUT);
    }
    FilterTable.prototype.Type = function () {
        return 0 /* FILTER */;
    };
    return FilterTable;
})(Table);
exports.FilterTable = FilterTable;
var NATTable = (function (_super) {
    __extends(NATTable, _super);
    function NATTable() {
        _super.call(this);
        this.PREROUTING = new Chain("PREROUTING", this, 0 /* PREROUTING */);
        this.OUTPUT = new Chain("OUTPUT", this, 3 /* OUTPUT */);
        this.POSTROUTING = new Chain("POSTROUTING", this, 4 /* POSTROUTING */);
        this.AddChain(this.PREROUTING);
        this.AddChain(this.OUTPUT);
        this.AddChain(this.POSTROUTING);
    }
    NATTable.prototype.Type = function () {
        return 1 /* NAT */;
    };
    return NATTable;
})(Table);
exports.NATTable = NATTable;
var MangleTable = (function (_super) {
    __extends(MangleTable, _super);
    function MangleTable() {
        _super.call(this);
        this.PREROUTING = new Chain("PREROUTING", this, 0 /* PREROUTING */);
        this.FORWARD = new Chain("FORWARD", this, 1 /* FORWARD */);
        this.INPUT = new Chain("INPUT", this, 2 /* INPUT */);
        this.OUTPUT = new Chain("OUTPUT", this, 3 /* OUTPUT */);
        this.POSTROUTING = new Chain("POSTROUTING", this, 4 /* POSTROUTING */);
        this.AddChain(this.PREROUTING);
        this.AddChain(this.FORWARD);
        this.AddChain(this.INPUT);
        this.AddChain(this.OUTPUT);
        this.AddChain(this.POSTROUTING);
    }
    MangleTable.prototype.Type = function () {
        return 2 /* MANGLE */;
    };
    return MangleTable;
})(Table);
exports.MangleTable = MangleTable;
var Iptable_Base = (function () {
    function Iptable_Base() {
        var _this = this;
        this._loaded = 0;
        this._load_callbacks = [];
        this.SetExec = function (name) {
            _this.Filter.Exec = _this.NAT.Exec = _this.Mangle.Exec = name;
        };
        this._loadCounter = function () {
            _this._loaded += 1;
            if (_this._loaded >= 3) {
                while (_this._load_callbacks.length > 0) {
                    _this._load_callbacks.pop()(null, _this);
                }
                trace("UP");
            }
        };
        this.Load = function () {
            _this._loaded = 0;
            _this.Filter.Load(_this._loadCounter);
            _this.NAT.Load(_this._loadCounter);
            _this.Mangle.Load(_this._loadCounter);
        };
        info("Initializing".bold);
        this.Filter = new FilterTable();
        this.NAT = new NATTable();
        this.Mangle = new MangleTable();
    }
    Iptable_Base.prototype.Loaded = function (callback) {
        if (this._loaded > 3) {
            callback(null, this);
        }
        else {
            this._load_callbacks.push(callback);
        }
    };
    return Iptable_Base;
})();
exports.Iptable_Base = Iptable_Base;
(function (ILimitUnit) {
    ILimitUnit[ILimitUnit["Second"] = 0] = "Second";
    ILimitUnit[ILimitUnit["Minute"] = 1] = "Minute";
    ILimitUnit[ILimitUnit["Hour"] = 2] = "Hour";
    ILimitUnit[ILimitUnit["Day"] = 3] = "Day";
})(exports.ILimitUnit || (exports.ILimitUnit = {}));
var ILimitUnit = exports.ILimitUnit;
(function (Target_Type) {
    Target_Type[Target_Type["ACCEPT"] = 0] = "ACCEPT";
    Target_Type[Target_Type["DROP"] = 1] = "DROP";
    Target_Type[Target_Type["REJECT"] = 2] = "REJECT";
    Target_Type[Target_Type["REDIRECT"] = 3] = "REDIRECT";
    Target_Type[Target_Type["DNAT"] = 4] = "DNAT";
    Target_Type[Target_Type["SNAT"] = 5] = "SNAT";
    Target_Type[Target_Type["MASQUERADE"] = 6] = "MASQUERADE";
    Target_Type[Target_Type["TOS"] = 10] = "TOS";
    Target_Type[Target_Type["TTL"] = 11] = "TTL";
    Target_Type[Target_Type["CONNMARK"] = 12] = "CONNMARK";
    Target_Type[Target_Type["MARK"] = 999] = "MARK";
    Target_Type[Target_Type["RETURN"] = 1000] = "RETURN";
    Target_Type[Target_Type["CHAIN"] = 1001] = "CHAIN";
})(exports.Target_Type || (exports.Target_Type = {}));
var Target_Type = exports.Target_Type;
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        var _this = this;
        _super.apply(this, arguments);
        this.Index = -1;
        this.LastMeasure = 0;
        this.Delta_Bytes = 0;
        this.Delta_Packets = 0;
        this.Delta_Time = 0;
        this.Count_Packets = 0;
        this.Count_Bytes = 0;
        this.Save = function (callback) {
            if (_this.Index == -1) {
                _this.Chain.Add(_this, callback);
            }
            else {
                _this.Chain.Update(_this, callback);
            }
        };
        this.Remove = function (callback) {
            if (_this.Index == -1) {
                return callback(null, null);
            }
            else {
                _this.Chain.Remove(_this.Index, callback);
            }
        };
        this.Insert = function (index, callback) {
            _this.Chain.Insert(index, _this, callback);
        };
    }
    Rule.prototype._build_comma_list = function (lst, item) {
        if (lst && lst !== "") {
            return lst + "," + item;
        }
        else {
            return item;
        }
    };
    Rule.prototype.arr_to_commalst = function (arr) {
        if (!arr || arr.length == 0) {
            return "";
        }
        else {
            var data = "";
            for (var i = 0; i < arr.length - 1; i++) {
                data += arr[i] + ",";
            }
            data += arr[arr.length - 1];
            return data;
        }
    };
    Rule.prototype.tcpFlagtoString = function (flag) {
        var s;
        if (flag.NONE) {
            return "NONE";
        }
        else if (flag.ALL) {
            return "ALL";
        }
        var arr = [];
        if (flag.ACK) {
            arr.push("ACK");
        }
        if (flag.FIN) {
            arr.push("FIN");
        }
        if (flag.PSH) {
            arr.push("PSH");
        }
        if (flag.RST) {
            arr.push("RST");
        }
        if (flag.SYN) {
            arr.push("SYN");
        }
        if (flag.URG) {
            arr.push("URG");
        }
        s = this.arr_to_commalst(arr);
        if (s == "") {
            return "NONE";
        }
        else {
            return s;
        }
    };
    Rule.prototype.limitRateToString = function (rate) {
        var s = "";
        s += rate.Rate;
        if (rate.Unit == 3 /* Day */) {
            s += "/day";
        }
        else if (rate.Unit == 2 /* Hour */) {
            s += "/hour";
        }
        else if (rate.Unit == 1 /* Minute */) {
            s += "/minute";
        }
        else if (rate.Unit == 0 /* Second */) {
            s += "/second";
        }
        return s;
    };
    Rule.prototype.stateToString = function (state) {
        var arr = "";
        if (state.NEW) {
            arr += "NEW,";
        }
        if (state.ESTABLISHED) {
            arr += "ESTABLISHED,";
        }
        if (state.INVALID) {
            arr += "INVALID,";
        }
        if (state.RELATED) {
            arr += "RELATED,";
        }
        return arr.substr(0, arr.length - 1);
    };
    Rule.prototype.tosToString = function (tos) {
        if (tos.Maximize_Reliability) {
            return "0x04";
        }
        else if (tos.Maximize_Throughput) {
            return "0x08";
        }
        else if (tos.Minimize_Cost) {
            return "0x02";
        }
        else if (tos.Minimize_Delay) {
            return "0x04";
        }
        else if (tos.Normal) {
            return "0x00";
        }
        else {
            return undefined;
        }
    };
    Rule.prototype.natAddrRangeToString = function (nat) {
        var a = nat.Addr;
        if (nat.Addr_End) {
            a += "-" + nat.Addr_End;
        }
        if (this.IsEnabledForPort()) {
            if (nat.Port) {
                a += ":" + nat.Port;
                if (nat.Port_End) {
                    a += "-" + nat.Port_End;
                }
            }
        }
        return a;
    };
    Rule.prototype.IsEnabledForPort = function () {
        return (this.Protocol && (this.Protocol.TCP || this.Protocol.UDP));
    };
    Rule.prototype.toString = function () {
        var command = "";
        if (this.Protocol) {
            var _p;
            if (this.Protocol.TCP) {
                _p = this._build_comma_list(_p, "tcp");
            }
            else if (this.Protocol.UDP) {
                _p = this._build_comma_list(_p, "udp");
            }
            else if (this.Protocol.ICMP) {
                _p = this._build_comma_list(_p, "icmp");
            }
            else if (this.Protocol.USER_DEFINED) {
                _p = this.arr_to_commalst(this.Protocol.USER_DEFINED);
            }
            if (_p && _p !== "") {
                if (this.Protocol.Negate) {
                    command += " ! -p " + _p;
                }
                else {
                    command += " -p " + _p;
                }
            }
        }
        if (this.Source) {
            var _ip = this.Source.Addr + (this.Source.Prefix ? ("/" + this.Source.Prefix) : "");
            if (this.Source.Negate) {
                command += " ! -s " + _ip;
            }
            else {
                command += " -s " + _ip;
            }
        }
        if (this.Destination) {
            var _ip = this.Destination.Addr + (this.Destination.Prefix ? ("/" + this.Destination.Prefix) : "");
            if (this.Destination.Negate) {
                command += " ! -d " + _ip;
            }
            else {
                command += " -d " + _ip;
            }
        }
        if (this.Iface_In && this.Iface_In.Prefix) {
            var iface = this.Iface_In.Prefix;
            if (this.Iface_In.Id + 1 > this.Iface_In.Id) {
                iface += this.Iface_In.Id;
            }
            else {
                iface += "+";
            }
            if (this.Iface_In.Negate) {
                command += " ! -i " + iface;
            }
            else {
                command += " -i " + iface;
            }
        }
        if (this.Iface_Out && this.Iface_Out.Prefix) {
            var iface = this.Iface_Out.Prefix;
            if (this.Iface_Out.Id + 1 > this.Iface_Out.Id) {
                iface += this.Iface_Out.Id;
            }
            else {
                iface += "+";
            }
            if (this.Iface_Out.Negate) {
                command += " ! -o " + iface;
            }
            else {
                command += " -o " + iface;
            }
        }
        if (this.Fragment !== undefined && this.Fragment !== null) {
            command += this.Fragment ? " ! " : " " + "-f";
        }
        if (this.Source_Port && this.IsEnabledForPort()) {
            var sport = this.Source_Port.Id + "";
            if (this.Source_Port.End) {
                sport += ":" + this.Source_Port.End;
            }
            if (this.Source_Port.Negate) {
                command += " ! --sport" + sport;
            }
            else {
                command += " --sport " + sport;
            }
        }
        if (this.Destination_Port && this.IsEnabledForPort()) {
            var dport = this.Destination_Port.Id + "";
            if (this.Destination_Port.End) {
                dport += ":" + this.Destination_Port.End;
            }
            if (this.Destination_Port.Negate) {
                command += " ! --dport" + dport;
            }
            else {
                command += " --dport " + dport;
            }
        }
        if (this.TCP_Flags && this.TCP_Flags.Match && this.TCP_Flags.Range && this.Protocol && this.Protocol.TCP) {
            var range = this.tcpFlagtoString(this.TCP_Flags.Range);
            var match = this.tcpFlagtoString(this.TCP_Flags.Match);
            if (this.TCP_Flags.Negate) {
                command += " ! --tcp-flags" + range + " " + match;
            }
            else {
                command += " --tcp-flags " + range + " " + match;
            }
        }
        var once_match = false;
        if (!once_match && this.Match_Limit && ((this.Match_Limit.Burst !== undefined && this.Match_Limit.Burst !== null) || ((this.Match_Limit.Rate !== undefined && this.Match_Limit.Rate !== null) && (this.Match_Limit.Unit !== undefined && this.Match_Limit.Unit !== null)))) {
            var _limit = "";
            if (this.Match_Limit.Rate) {
                _limit += " --limit " + this.limitRateToString(this.Match_Limit.Rate);
            }
            if (this.Match_Limit.Burst) {
                _limit += " --limit-burst " + this.Match_Limit.Burst;
            }
            if (this.Match_Limit.Negate) {
                command += " -m ! limit " + _limit;
            }
            else {
                command += " -m limit " + _limit;
            }
            once_match = true;
        }
        if (!once_match && this.Match_MAC && this.Match_MAC.Addr) {
            if (this.Match_MAC.Negate) {
                command += " -m mac ! --mac-source" + this.Match_MAC.Addr;
            }
            else {
                command += " -m mac --mac-source " + this.Match_MAC.Addr;
            }
            once_match = true;
        }
        if (!once_match && this.Match_Mark && this.Match_Mark.Value) {
            if (this.Match_Mark.Mask) {
                command += " -m mark --mark " + this.Match_Mark.Value + "/" + this.Match_Mark.Mask;
            }
            else {
                command += " -m mark --mark " + this.Match_Mark.Value;
            }
            once_match = true;
        }
        if (!once_match && this.Match_SET && this.Match_SET.SetName) {
            if (this.Match_SET.MatchDestination && this.Match_SET.MatchSource) {
                command += " -m set --match-set " + this.Match_SET.SetName + " src,dst";
                once_match = true;
            }
            else if (this.Match_SET.MatchSource) {
                command += " -m set --match-set " + this.Match_SET.SetName + " src";
                once_match = true;
            }
            else if (this.Match_SET.MatchDestination) {
                command += " -m set --match-set " + this.Match_SET.SetName + " dst";
                once_match = true;
            }
        }
        if (!once_match && this.IsEnabledForPort() && this.Match_Multiport !== undefined && (((this.Match_Multiport.Destination && this.Match_Multiport.Destination.length > 0) || (this.Match_Multiport.Source && this.Match_Multiport.Source.length > 0)) || (this.Match_Multiport.SrcAndDst && this.Match_Multiport.SrcAndDst.length > 0))) {
            if (this.Match_Multiport.SrcAndDst && this.Match_Multiport.SrcAndDst.length > 0) {
                command += " -m multiport --port " + this.arr_to_commalst(this.Match_Multiport.SrcAndDst);
            }
            else {
                var mp_dst = "";
                var mp_src = "";
                if (this.Match_Multiport.Destination && this.Match_Multiport.Destination.length > 0) {
                    mp_dst = " --destination-port " + this.arr_to_commalst(this.Match_Multiport.Destination);
                }
                if (this.Match_Multiport.Source && this.Match_Multiport.Source.length > 0) {
                    mp_src = " --source-port " + this.arr_to_commalst(this.Match_Multiport.Source);
                }
                command += " -m multiport" + mp_src + mp_dst;
            }
            once_match = true;
        }
        if (!once_match && this.Match_State && (this.Match_State.ESTABLISHED || this.Match_State.NEW || this.Match_State.INVALID || this.Match_State.RELATED)) {
            command += " -m state --state " + this.stateToString(this.Match_State);
            once_match = true;
        }
        if (!once_match && this.Match_TOS && this.tosToString(this.Match_TOS)) {
            command += " -m tos --tos " + this.tosToString(this.Match_TOS);
            once_match = true;
        }
        if (!once_match && (this.Match_TTL > this.Match_TTL - 1)) {
            command += " -m ttl --ttl " + this.Match_TTL;
            once_match = true;
        }
        var once_target = false;
        if (!once_target && this.Target === 0 /* ACCEPT */) {
            command += " -j ACCEPT";
            once_target = true;
        }
        if (!once_target && this.Target === 1 /* DROP */) {
            command += " -j DROP";
            once_target = true;
        }
        if (!once_target && this.Target === 1000 /* RETURN */) {
            command += " -j RETURN";
            once_target = true;
        }
        if (!once_target && this.Target === 999 /* MARK */) {
            if (this.TargetOptions.SET_Mark !== undefined) {
                command += " -j MARK --set-mark " + this.TargetOptions.SET_Mark;
                once_target = true;
            }
            else if (this.TargetOptions.OR_Mark !== undefined) {
                command += " -j MARK --or-mark " + this.TargetOptions.OR_Mark;
                once_target = true;
            }
            else if (this.TargetOptions.AND_Mark !== undefined) {
                command += " -j MARK --and-mark " + this.TargetOptions.AND_Mark;
                once_target = true;
            }
            else if (this.TargetOptions.XOR_Mark !== undefined) {
                command += " -j MARK --xor-mark " + this.TargetOptions.XOR_Mark;
                once_target = true;
            }
        }
        if (!once_target && this.Target === 6 /* MASQUERADE */) {
            var _pt = "";
            if (this.TargetOptions) {
                var port = this.TargetOptions.Port;
                if (this.IsEnabledForPort() && port && port.Id) {
                    _pt = " --to-ports " + port.Id;
                    if (port.End) {
                        _pt += "-" + port.End;
                    }
                }
            }
            command += " -j MASQUERADE" + _pt;
            once_target = true;
        }
        if (!once_target && this.Target === 3 /* REDIRECT */ && this.IsEnabledForPort() && this.TargetOptions.Port && this.TargetOptions.Port.Id) {
            var _pt = "";
            _pt = " --to-ports " + this.TargetOptions.Port.Id;
            if (this.TargetOptions.Port.End) {
                _pt += "-" + this.TargetOptions.Port.End;
            }
            command += " -j REDIRECT" + _pt;
            once_target = true;
        }
        if (!once_target && this.Target === 4 /* DNAT */ && this.TargetOptions.To_Destination && this.TargetOptions.To_Destination.Addr) {
            command += " -j DNAT --to-destination " + this.natAddrRangeToString(this.TargetOptions.To_Destination);
            once_target = true;
        }
        if (!once_target && this.Target === 5 /* SNAT */ && this.TargetOptions.To_Source && this.TargetOptions.To_Source.Addr) {
            command += " -j SNAT --to-source " + this.natAddrRangeToString(this.TargetOptions.To_Source);
            once_target = true;
        }
        if (!once_target && this.Target === 10 /* TOS */ && this.TargetOptions.TOS) {
            command += " -j TOS --set-tos " + this.tosToString(this.TargetOptions.TOS);
            once_target = true;
        }
        if (!once_target && this.Target === 11 /* TTL */ && (this.TargetOptions.Set || this.TargetOptions.Decrement || this.TargetOptions.Increment)) {
            var op = this.TargetOptions;
            if (op.Set) {
                command += " -j TTL --ttl-set " + op.Set;
            }
            else if (op.Decrement) {
                command += " -j TTL --ttl-dec " + op.Decrement;
            }
            else if (op.Increment) {
                command += " -j TTL --ttl-inc " + op.Increment;
            }
            once_target = true;
        }
        if (!once_target && this.Target === 12 /* CONNMARK */ && (this.TargetOptions.RestoreMark)) {
            var conmark = this.TargetOptions;
            if (conmark.RestoreMark) {
                command += " -j CONNMARK --restore-mark";
            }
            once_target = true;
        }
        if (!once_target && this.Target === 1001 /* CHAIN */ && (this.TargetOptions.Chain)) {
            command += " -j " + this.TargetOptions.Chain;
            once_target = true;
        }
        command += " --set-counters " + this.Count_Packets + " " + this.Count_Bytes;
        return command;
    };
    return Rule;
})(events.EventEmitter);
exports.Rule = Rule;
exports.Iptables = new Iptable_Base();
exports.Iptables_IPV6 = new Iptable_Base();
function Initialize(cb) {
    exports.Iptables.Load();
    exports.Iptables.Loaded(function () {
        if (CONF.IPTABLES_6) {
            exports.Iptables_IPV6.SetExec("ip6tables");
            exports.Iptables_IPV6.Load();
            exports.Iptables_IPV6.Loaded(cb);
        }
        else {
            cb();
        }
    });
}
exports.Initialize = Initialize;
