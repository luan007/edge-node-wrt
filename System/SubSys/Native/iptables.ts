//TODO: Need rework to stay matched-up with recent iptable-updates :p


/*
 * 
 * 
 * 
 *                                            +------- MANGLE -> FILTER ----------------------------------------------+
 *                                            |      [FORWARD] [FORWARD]                                              |
 *                                            |                                                                       |
 *      MANGLE    ->    NAT   -----(ROUTE)----+                                                                       +-->     MANGLE   ----->   NAT  ---- >>> (RESULT）
 *   [PREROUTING]  [PREROUTING]               |                                                                       |    [POSTROUTING]    [POSTROUTING] 
 *                                            |                                                                       |
 *                                            +------- MANGLE -> FILTER  + ..... + -> MANGLE -> NAT -> FILTER --------+
 *                                                   [ INPUT ] [ INPUT ]   (APP)    [OUTPUT] [OUTPUT] [OUTPUT]
 *                       
 * 
 * http://www.policyrouting.org/iproute2.doc.html#ss9.16
 */
// Project Edge
// 
// Mike Luan, 2014


// Following code may/or WILL destroy your network / config, 
// Causing: boot-failure(if you dare to iptable-save)
//          disconnection from remote machine and NEVER being able to linkup
//          dropping useful packets..
//          ..
// DO NOT USE THIS ON REMOTE MACHINE
// DO NOT TRUST THIS CODE-PAGE
// please use with caution, you've been warnd :P

import child_process = require("child_process");
var spawn = child_process.spawn;
import events = require("events");


var _name = "Iptables";

export enum TABLE_TYPE {

    FILTER = 0,
    NAT = 1,
    MANGLE = 2

}

export enum CHAIN_TYPE {

    PREROUTING = 0,
    FORWARD = 1,
    INPUT = 2,
    OUTPUT = 3,
    POSTROUTING = 4,
    USER = 10000

}

export enum POLICY_TYPE {

    ACCEPT = 0,
    DROP = 1

}

export class Table {

    Exec = "iptables";
    
    Type(): TABLE_TYPE { return TABLE_TYPE.FILTER; }

    Chains: IDic<Chain> = <any>{};

    public AddChain = (chain: Chain, cb?) => {
        if (chain.IsUserDefined()) {
            //Run cmd
            this.RawRuleCmd("-N " + chain.Name, (err) => {
                this.Chains[chain.Name] = chain;
                cb(err);
            });
        } else {
            this.Chains[chain.Name] = chain;
        }
    };

    public Name = () => {
        switch (this.Type()) {
            case TABLE_TYPE.FILTER:
                return "filter";
            case TABLE_TYPE.NAT:
                return "nat";
            case TABLE_TYPE.MANGLE:
                return "mangle";
        }
    };

    constructor() {
        //run -X -F
    }

    public Load = (loaded) => {
        this.RawRuleCmd("-F", () => {
            this.RawRuleCmd("-X", () => {
                this._guard_Timer = setTimeout(this._guard, 3000);
                loaded(null, this);
            });
        });
    };

    private _changeVal = 1;
    private _lastDelta = 0;
    private _lastMeasure = 0;

    private _guard_Timer;
    private _guard = () => {
        clearTimeout(this._guard_Timer);
        var dateA = new Date().getTime();

        //Filter, NAT, Mangle
        //THIS IS JUST SO FREAKING FAST MAN... (better than IPTABLES-SAVE), MUCHHHHHH BETTER!!!
        //7000Lines ~ 50ms

        //info(this.Exec + " " + this.Name() + " _GUARD");
        //TODO: investigate.. something is not working..
        var parser = parsespawn(this.Exec, ["-t", this.Name(), "-vnxL", "--line-number"]);
        var curchain: Chain = undefined;
        var change = -3;
        var deltaA = 0;
        parser.on("out_line", (line) => {
            var ln = (line + "").trim();
            if (ln[0] == "C") { // CHAIN 
                //"Chain XXXXX "
                var chain = ln.split(" ")[1];
                if (this.Chains[chain] !== undefined) {
                    curchain = this.Chains[chain];
                    var b = parseInt(ln.split(" ")[6]);
                    var p = parseInt(ln.split(" ")[4]);
                    var deltaB = Math.abs(b - curchain.Bytes);
                    deltaA += deltaB;
                    if (deltaB !== 0 || p !== curchain.Packets) {
                        curchain.Delta_Bytes = b - curchain.Bytes;
                        curchain.Delta_Packets = p - curchain.Packets;
                        curchain.Delta_Time = new Date().getTime() - g.LastMeasure;
                        curchain.LastMeasure = new Date().getTime();
                        var old_B = curchain.Bytes;
                        var old_P = curchain.Packets;
                        curchain.Bytes = b;
                        curchain.Packets = p;
                        curchain.emit("traffic", curchain, b, old_B, p, old_P, curchain.Delta_Time);
                    }
                }
            } else if (ln[0] == "n") {
                //skip
            } else if (curchain && ln != "") {
                //good
                var contents = ln.split(/\s+/);
                var num = parseInt(contents[0]);
                var pkgs = parseInt(contents[1]);
                var bytes = parseInt(contents[2]);
                var g = curchain.Get(num - 1);
                if (g) {
                    if (g.Count_Bytes !== bytes || g.Count_Packets !== pkgs) {
                        //trigger event if u wish
                        var oldB = g.Count_Bytes;
                        var oldP = g.Count_Packets;
                        //let's do this
                        g.Delta_Bytes = bytes - g.Count_Bytes;
                        g.Delta_Packets = pkgs - g.Count_Packets;
                        g.Delta_Time = new Date().getTime() - g.LastMeasure;
                        g.Count_Bytes = bytes;
                        g.Count_Packets = pkgs;
                        g.LastMeasure = new Date().getTime();
                        g.emit("traffic", g, bytes, oldB, pkgs, oldP, g.Delta_Time);
                    }
                }
            }
        });

        parser.on("err_line", (line) => {
            error(new Error(line), "");
        });

        parser.once("exit", () => {

            parser.removeAllListeners();
            var dateB = new Date().getTime();
            var deltaT = (dateB - this._lastMeasure) / 1000;

            deltaA /= deltaT;
            var a = Math.abs(this._lastDelta - deltaA);
            /*
             * A is |acceleration| of network bandwidth
             * which measures how fast the net-usage CHANGES (no matter up or down)
             * The faster it changes, more detail we should pay attention to,
             * which leads to increase of monitor speed
             */
            if (a > 10000) { //emm wobbly
                if (a < 30000) { // (v) < 30K change - keep it still this is good
                    change = 0;
                } else if (a < 150000) { // < 150K
                    change = 0.5; //increase to catchup
                } else if (a < 300000) { // < 300K
                    change = 1; //wow that's pretty fast
                } else if (a < 1000000) { // < 1M
                    change = 2; //catching up quick
                } else if (a < 3000000) { // < 3M
                    change = 4; //that's insane
                } else if (a < 10000000) { // ~10M
                    change = 6; //ROCKET
                } else {
                    change = 10; //MAX IT OUT
                }
            }

            this._lastDelta = deltaA;

            this._changeVal += change;
            this._changeVal = Math.max(1, this._changeVal);
            this._changeVal = Math.min(10, this._changeVal);
            var span = dateB - dateA;
            //overall performance
            var nextloop = span * 500; // duty cycle
            nextloop = Math.max(5000, nextloop);   //MIN = 5s - NO THROTTLE
            nextloop = Math.min(15000, nextloop); //MAX = 15S
            //throttle
            nextloop /= this._changeVal; //CAP = ~200ms

            this._lastMeasure = new Date().getTime();

            this._guard_Timer = setTimeout(this._guard, nextloop);
            //console.log("Exit.. next:" + nextloop);
        });

    };

    public SetPolicy(chain_t: CHAIN_TYPE, policy: POLICY_TYPE, callback) {
        var chain = Table.ChainTypeToString(chain_t);
        if (!chain) {
            return;
        }
        var target = "ACCEPT";
        switch (policy) {
            case POLICY_TYPE.DROP:
                target = "DROP";
                break;
        }
        this.RawRuleCmd("-P " + chain + " " + target, callback);
    }

    public static ChainTypeToString(chain_t: CHAIN_TYPE) {
        switch (chain_t) {
            case CHAIN_TYPE.FORWARD:
                return "FORWARD";
            case CHAIN_TYPE.INPUT:
                return "INPUT";
            case CHAIN_TYPE.OUTPUT:
                return "OUTPUT";
            case CHAIN_TYPE.POSTROUTING:
                return "POSTROUTING";
            case CHAIN_TYPE.PREROUTING:
                return "PREROUTING";
            default:
                return undefined;
        }
    }

    /**
     * Send iptable -t xx ... command
     * Uses process.exec, thus no output should be present
     * 
     * Not Recommanded - No Chain check
     */
    public RawRuleCmd = (command: string, callback) => {

        //BE ATOM PLEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZE
        exec(this.Exec + " -w -t " + this.Name() + " " + command, (err, stdout, stderr) => {
            callback(err, {
                out: stdout,
                err: stderr
            });
        });
    }
}

export class Chain extends events.EventEmitter {

    Packets: number = 0;

    Bytes: number = 0;

    Delta_Bytes: number = 0;

    Delta_Packets: number = 0;

    Delta_Time: number = 0;

    Name: string = "";

    Type: CHAIN_TYPE = CHAIN_TYPE.USER;

    private Rules: Rule[] = [];

    Table: Table = null; //can NOT be null

    LastMeasure: number = 0;

    constructor(name, table: Table, type: CHAIN_TYPE = CHAIN_TYPE.USER) {
        super();
        this.Name = name;
        this.Type = type;
        this.Table = table;
    }

    public IsUserDefined = () => {
        return this.Type === CHAIN_TYPE.USER;
    };

    public Add = (rule: Rule, callback: Callback) => {
        if (rule.Index == -1) {
            rule.Chain = this;
            var str = rule.toString();
            this.RawChainCommand("-A", str, (err, data) => {
                if (data.err.length > 0) {
                    //ERROR
                    error(new Error(data.err), "");
                    callback(new Error(data.err), undefined);
                }
                else {
                    this.Rules.push(rule);
                    rule.Index = this.Rules.length - 1;
                    callback(null, rule);
                }
            });
        } else {
            return callback(new Error("Rule Exists"), null);
        }
    };

    public Get = (index: number): Rule => {
        return this.Rules[index];
    };

    public Remove = (index: number, callback: Callback) => {
        if (this.Rules.length - 1 <= index) {
            return callback(new Error("index out of range"), undefined);
        }
        this.RawChainCommand("-D", (index + 1) + "", (err, data) => {
            if (data.err.length > 0) {
                //ERROR
                error(new Error(data.err), "");
                callback(new Error(data.err), undefined);
            }
            else {
                var rule = this.Rules[index];
                rule.Index = -1;
                this.Rules = this.Rules.splice(index, 1);
                for (var i = index; i < this.Rules.length; i++) {
                    this.Rules[i].Index = i;
                }
                callback(null, null);
            }
        });
    };

    public Update = (rule_with_index: Rule, callback: Callback) => {
        this.RawChainCommand("-R", (rule_with_index.Index + 1) + " " + rule_with_index.toString(), (err, data) => {
            if (data.err.length > 0) {
                //ERROR
                error(new Error(data.err), "");
                callback(new Error(data.err), undefined);
            }
            else {
                callback(null, rule_with_index);
            }
        });
    };

    public Insert = (index: number, rule: Rule, callback: Callback) => {
        var _i = index;
        if (index >= this.Rules.length) {
            _i = this.Rules.length - 1;
        }
        _i += 1;
        var str = rule.toString();
        rule.Chain = this;
        this.RawChainCommand("-I", _i + " " + str, (err, data) => {
            if (data.err.length > 0) {
                //ERROR
                error(new Error(data.err), "");
                callback(new Error(data.err), undefined);
            }
            else {
                this.Rules = this.Rules.splice(_i - 1, 0, rule);
                rule.Index = _i - 1;
                for (var i = _i; i < this.Rules.length; i++) {
                    this.Rules[i].Index = i;
                }
                callback(null, rule);
            }
        });
    };

    public Size = (): number => {
        return this.Rules.length;
    };

    public RawChainCommand = (action: string, param: string, callback) => {
        //ATOM PLEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZE
        this.Table.RawRuleCmd(action + " " + this.Name + " " + param, callback);
    };
}

export class FilterTable extends Table {

    Type(): TABLE_TYPE { return TABLE_TYPE.FILTER; }

    public FORWARD: Chain = new Chain("FORWARD", this, CHAIN_TYPE.FORWARD);

    public INPUT: Chain = new Chain("INPUT", this, CHAIN_TYPE.INPUT);

    public OUTPUT: Chain = new Chain("OUTPUT", this, CHAIN_TYPE.OUTPUT);

    constructor() {
        super();
        this.AddChain(this.FORWARD);
        this.AddChain(this.INPUT);
        this.AddChain(this.OUTPUT);
    }

}

export class NATTable extends Table {

    Type(): TABLE_TYPE { return TABLE_TYPE.NAT; }

    public PREROUTING: Chain = new Chain("PREROUTING", this, CHAIN_TYPE.PREROUTING);

    public OUTPUT: Chain = new Chain("OUTPUT", this, CHAIN_TYPE.OUTPUT);

    public POSTROUTING: Chain = new Chain("POSTROUTING", this, CHAIN_TYPE.POSTROUTING);

    constructor() {
        super();
        this.AddChain(this.PREROUTING);
        this.AddChain(this.OUTPUT);
        this.AddChain(this.POSTROUTING);
    }
}

export class MangleTable extends Table {

    Type(): TABLE_TYPE { return TABLE_TYPE.MANGLE; }

    public PREROUTING: Chain = new Chain("PREROUTING", this, CHAIN_TYPE.PREROUTING);

    public FORWARD: Chain = new Chain("FORWARD", this, CHAIN_TYPE.FORWARD);

    public INPUT: Chain = new Chain("INPUT", this, CHAIN_TYPE.INPUT);

    public OUTPUT: Chain = new Chain("OUTPUT", this, CHAIN_TYPE.OUTPUT);

    public POSTROUTING: Chain = new Chain("POSTROUTING", this, CHAIN_TYPE.POSTROUTING);

    constructor() {
        super();
        this.AddChain(this.PREROUTING);
        this.AddChain(this.FORWARD);
        this.AddChain(this.INPUT);
        this.AddChain(this.OUTPUT);
        this.AddChain(this.POSTROUTING);
    }
}

export class Iptable_Base {

    public Filter: FilterTable;

    public NAT: NATTable;

    public Mangle: MangleTable;

    private _loaded = 0;

    private _load_callbacks = [];

    public SetExec = (name) => {
        this.Filter.Exec =
        this.NAT.Exec =
        this.Mangle.Exec = name;
    };

    private _loadCounter = () => {
        this._loaded += 1;
        if (this._loaded >= 3) {
            while (this._load_callbacks.length > 0) {
                this._load_callbacks.pop()(null, this);
            }
            trace("UP");
        }
    };

    constructor() {
        info("Initializing".bold);
        this.Filter = new FilterTable();
        this.NAT = new NATTable();
        this.Mangle = new MangleTable();
    }

    public Load = () => {
        this._loaded = 0;
        this.Filter.Load(this._loadCounter);
        this.NAT.Load(this._loadCounter);
        this.Mangle.Load(this._loadCounter);
    };

    public Loaded(callback) {
        if (this._loaded > 3) {
            callback(null, this);
        } else {
            this._load_callbacks.push(callback);
        }
    }

}


/* RULE RULES ALL */

export interface INot {
    Negate?: boolean;
}

export interface IProtocol extends INot {
    TCP?: boolean;
    UDP?: boolean;
    ICMP?: boolean;

    //USER DEFINED PROTOCOL
    USER_DEFINED?: number[];
}

export interface IAddress extends INot {
    Addr: string;
    Prefix?: string;
}

export interface INATAddress {

    //192.168.1.1
    Addr: string;

    //192.168.1.10  -> 192.168.1.1-192.168.1.10
    Addr_End?: string;

    //80
    Port?: number;

    //1000 -> 192.168.1.1-192.168.1.10:80-1000
    Port_End?: number;

}

export interface IPort extends INot {

    Id: number;

    /**
     * Optional
     * 
     * If Initialized, OUTPUTs range of port
     * Id : Id_End
     */
    End?: number;

}

export interface IPhy extends INot {
    Prefix: string;
    Id?: number;
}

export interface ITCP_Flag_Selections {

    ALL?: boolean;
    NONE?: boolean;
    SYN?: boolean;
    ACK?: boolean;
    FIN?: boolean;
    RST?: boolean;
    URG?: boolean;
    PSH?: boolean;

}

export interface ITCP_Flag extends INot {

    Range: ITCP_Flag_Selections;
    Match: ITCP_Flag_Selections;

}

export enum ILimitUnit {
    Second = 0,
    Minute = 1,
    Hour = 2,
    Day = 3
}

export interface ILimit extends INot {

    Rate?: number;

    Unit?: ILimitUnit;

    Burst?: number;

}

export interface IMAC_Addr extends INot {

    Addr: string;

}

export interface IMark {

    Value: string;

    Mask?: string;

}

export interface IMultiport {

    Source?: number[];

    Destination?: number[];

    SrcAndDst?: number[];

}

export interface IState {

    INVALID?: boolean;

    NEW?: boolean;

    RELATED?: boolean;

    ESTABLISHED?: boolean;

}

export interface ITOS {

    Minimize_Delay?: boolean;

    Maximize_Throughput?: boolean;

    Maximize_Reliability?: boolean;

    Minimize_Cost?: boolean;

    Normal?: boolean;

}

export enum Target_Type {

    ACCEPT = 0,
    DROP = 1,
    REJECT = 2,
    REDIRECT = 3,
    DNAT = 4,
    SNAT = 5,
    MASQUERADE = 6,
    //MIRROR = 7,
    //QUEUE = 8,
    //LOG = 9,
    TOS = 10,
    TTL = 11,
    CONNMARK = 12,
    MARK = 999,
    RETURN = 1000,

    CHAIN = 1001

}

export interface ISet {

    SetName: string;

    MatchSource?: boolean;

    MatchDestination?: boolean;

}

export interface ITargetOption { /*BASE*/ }

export interface IConnMarkOption {
    RestoreMark: boolean;
}

export interface IDNATOption extends ITargetOption {
    To_Destination: INATAddress;
}

export interface ISNATOption extends ITargetOption {
    To_Source: INATAddress;
}

export interface IMarkOption extends ITargetOption {
    SET_Mark: string;
    OR_Mark: string;
    AND_Mark: string;
    XOR_Mark: string;
}

export interface IMasqueradeOption extends ITargetOption {
    Port?: IPort;
}

export interface IRedirectOption extends ITargetOption {
    Port?: IPort;
}

export interface IRejectOption extends ITargetOption {

    TCP_RESET?: boolean;
    PORT_UNREACHABLE?: boolean;
    //ICMP crap

}

export interface ITOSOption extends ITargetOption {

    TOS: ITOS;

}

export interface ITTLOption extends ITargetOption {

    Set?: number;

    Decrement?: number;

    Increment?: number;

}

export interface IChainOption extends ITargetOption {

    Chain: string;

}

export class Rule extends events.EventEmitter {

    Index: number = -1;

    LastMeasure: number = 0;

    Delta_Bytes: number = 0;
    
    Delta_Packets: number = 0;

    Delta_Time: number = 0;

    Count_Packets: number = 0;

    Count_Bytes: number = 0;

    Chain: Chain;

    /* GENERIC */

    Protocol: IProtocol;

    Source: IAddress;

    Destination: IAddress;

    /**
     * ONLY USE ON:
     * INPUT, FORWARD, PREROUTING 
     */
    Iface_In: IPhy;

    Iface_Out: IPhy;

    /**
     * Default: undefined
     * True: -f / --fragment
     * False: ! -f
     */
    Fragment: boolean;

    /* PROTOCOL SPEC */

    /**
     * TCP / UDP Only
     */
    Source_Port: IPort;

    /**
     * TCP / UDP Only
     */
    Destination_Port: IPort;

    /**
     * TCP Only
     */
    TCP_Flags: ITCP_Flag;

    //NOT IMPLEMENTED:
    //SYN
    //TCP-OPTION
    //ICMP TYPE

    /* --MATCH */

    /**
     * Use -m once (max) per rule
     */
    Match_Limit: ILimit;

    /**
     * ONLY AVAILABLE IN ETHERNET + PREROUTING, FORWARD, INPUT
     * Use -m once (max) per rule
     */
    Match_MAC: IMAC_Addr;

    /**
     * Use -m once (max) per rule
     */
    Match_Mark: IMark;

    /**
     * Use -m once (max) per rule
     * Do not use standard port match (src/dst) when using multiport match
     * Max 15 Port
     */
    Match_Multiport: IMultiport;

    /**
     * Use -m once (max) per rule
     */
    Match_State: IState;

    /**
     * Use -m once (max) per rule
     */
    Match_TOS: ITOS;

    /**
     * Use -m once (max) per rule
     */
    Match_TTL: number;

    /**
     * Use -m once (max) per rule
     * !IPSET!
     */
    Match_SET: ISet;


    /* TARGET */

    Target: Target_Type;

    TargetOptions: ITargetOption;

    private _build_comma_list(lst: string, item: string) {
        if (lst && lst !== "") {
            return lst + "," + item;
        } else {
            return item;
        }
    }

    private arr_to_commalst(arr: any[]) {
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
    }

    private tcpFlagtoString(flag: ITCP_Flag_Selections) {
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
    }

    private limitRateToString(rate: ILimit) {
        var s = "";
        s += rate.Rate;

        if (rate.Unit == ILimitUnit.Day) {
            s += "/day";
        } else if (rate.Unit == ILimitUnit.Hour) {
            s += "/hour";
        } else if (rate.Unit == ILimitUnit.Minute) {
            s += "/minute";
        } else if (rate.Unit == ILimitUnit.Second) {
            s += "/second";
        }

        return s;
    }

    private stateToString(state: IState) {
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
    }

    private tosToString(tos: ITOS) {
        if (tos.Maximize_Reliability) {
            return "0x04";
        } else if (tos.Maximize_Throughput) {
            return "0x08";
        } else if (tos.Minimize_Cost) {
            return "0x02";
        } else if (tos.Minimize_Delay) {
            return "0x04";
        } else if (tos.Normal) {
            return "0x00";
        } else {
            return undefined;
        }
    }

    private natAddrRangeToString(nat: INATAddress) {

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
    }

    public IsEnabledForPort() {
        return (this.Protocol && (this.Protocol.TCP || this.Protocol.UDP));
    }

    public Save = (callback: Callback) => {
        if (this.Index == -1) {
            this.Chain.Add(this, callback);
        }
        else {
            this.Chain.Update(this, callback);
        }
    };

    public Remove = (callback: Callback) => {
        if (this.Index == -1) {
            return callback(null, null);
        }
        else {
            this.Chain.Remove(this.Index, callback);
        }
    };

    public Insert = (index: number, callback: Callback) => {
        this.Chain.Insert(index, this, callback);
    };

    public toString() {

        var command = "";

        //#region -p PROTOCAL

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
                } else {
                    command += " -p " + _p;
                }
            }

        }

        //#endregion

        //#region -s SOURCE

        if (this.Source) {
            var _ip = this.Source.Addr + (this.Source.Prefix ? ("/" + this.Source.Prefix) : "");
            if (this.Source.Negate) {
                command += " ! -s " + _ip;
            } else {
                command += " -s " + _ip;
            }
        }

        //#endregion

        //#region -d DESTINATION

        if (this.Destination) {
            var _ip = this.Destination.Addr + (this.Destination.Prefix ? ("/" + this.Destination.Prefix) : "");
            if (this.Destination.Negate) {
                command += " ! -d " + _ip;
            } else {
                command += " -d " + _ip;
            }
        }
        
        //#endregion

        //#region -i IN_INTERFACE

        if (this.Iface_In && this.Iface_In.Prefix) {
            var iface = this.Iface_In.Prefix;
            if (this.Iface_In.Id + 1 > this.Iface_In.Id) {
                iface += this.Iface_In.Id;
            } else {
                iface += "+";
            }
            if (this.Iface_In.Negate) {
                command += " ! -i " + iface;
            } else {
                command += " -i " + iface;
            }
        }

        //#endregion

        //#region -o OUT_INTERFACE

        if (this.Iface_Out && this.Iface_Out.Prefix) {
            var iface = this.Iface_Out.Prefix;
            if (this.Iface_Out.Id + 1 > this.Iface_Out.Id) {
                iface += this.Iface_Out.Id;
            } else {
                iface += "+";
            }
            if (this.Iface_Out.Negate) {
                command += " ! -o " + iface;
            } else {
                command += " -o " + iface;
            }
        }

        //#endregion

        //#region -f FRAGMENT

        if (this.Fragment !== undefined &&
            this.Fragment !== null) {
            command += this.Fragment ? " ! " : " " + "-f";
        }

        //#endregion

        //#region --sport SOURCE-PORT

        if (this.Source_Port && this.IsEnabledForPort()) {
            var sport = this.Source_Port.Id + "";
            if (this.Source_Port.End) {
                sport += ":" + this.Source_Port.End;
            }
            if (this.Source_Port.Negate) {
                command += " ! --sport" + sport;
            } else {
                command += " --sport " + sport;
            }
        }

        //#endregion

        //#region --dport DEST-PORT

        if (this.Destination_Port && this.IsEnabledForPort()) {
            var dport = this.Destination_Port.Id + "";
            if (this.Destination_Port.End) {
                dport += ":" + this.Destination_Port.End;
            }
            if (this.Destination_Port.Negate) {
                command += " ! --dport" + dport;
            } else {
                command += " --dport " + dport;
            }
        }

        //#endregion

        //#region --tcp-flags TCP-FLAGS

        if (this.TCP_Flags && this.TCP_Flags.Match && this.TCP_Flags.Range
            && this.Protocol && this.Protocol.TCP) {

            var range = this.tcpFlagtoString(this.TCP_Flags.Range);
            var match = this.tcpFlagtoString(this.TCP_Flags.Match);


            if (this.TCP_Flags.Negate) {
                command += " ! --tcp-flags" + range + " " + match;
            } else {
                command += " --tcp-flags " + range + " " + match;
            }

        }

        //#endregion

        /* MODULES */

        var once_match = false;

        //#region --limit LIMIT

        if (!once_match && this.Match_Limit &&
            ((this.Match_Limit.Burst !== undefined && this.Match_Limit.Burst !== null) ||
            ((this.Match_Limit.Rate !== undefined && this.Match_Limit.Rate !== null) && (this.Match_Limit.Unit !== undefined && this.Match_Limit.Unit !== null)))
            ) {
            var _limit = "";
            if (this.Match_Limit.Rate) {
                _limit += " --limit " + this.limitRateToString(this.Match_Limit.Rate);
            }

            if (this.Match_Limit.Burst) {
                _limit += " --limit-burst " + this.Match_Limit.Burst;
            }

            if (this.Match_Limit.Negate) {
                command += " -m ! limit " + _limit;
            } else {
                command += " -m limit " + _limit
            }
            once_match = true;
        }

        //#endregion

        //#region --mac MAC

        if (!once_match && this.Match_MAC && this.Match_MAC.Addr) {

            if (this.Match_MAC.Negate) {
                command += " -m mac ! --mac-source" + this.Match_MAC.Addr;
            } else {
                command += " -m mac --mac-source " + this.Match_MAC.Addr;
            }
            once_match = true;

        }

        //#endregion

        //#region --mark MARK

        if (!once_match && this.Match_Mark && this.Match_Mark.Value) {

            if (this.Match_Mark.Mask) {
                command += " -m mark --mark " + this.Match_Mark.Value + "/" + this.Match_Mark.Mask;
            } else {
                command += " -m mark --mark " + this.Match_Mark.Value;
            }
            once_match = true;

        }

        //#region --mark SET

        if (!once_match && this.Match_SET && this.Match_SET.SetName) {

            if (this.Match_SET.MatchDestination && this.Match_SET.MatchSource) {
                command += " -m set --match-set " + this.Match_SET.SetName + " src,dst";
                once_match = true;
            } else if (this.Match_SET.MatchSource) {
                command += " -m set --match-set " + this.Match_SET.SetName + " src";
                once_match = true;
            } else if (this.Match_SET.MatchDestination) {
                command += " -m set --match-set " + this.Match_SET.SetName + " dst";
                once_match = true;
            }
        }

        //#endregion

        //#region --source-port / --destination-port / --port MULTIPORT

        //[ Source or Destination ] or [ ALL ]
        if (!once_match && this.IsEnabledForPort()
            && this.Match_Multiport !== undefined
            && (((this.Match_Multiport.Destination && this.Match_Multiport.Destination.length > 0)
            || (this.Match_Multiport.Source && this.Match_Multiport.Source.length > 0))
            || (this.Match_Multiport.SrcAndDst && this.Match_Multiport.SrcAndDst.length > 0))) {

            if (this.Match_Multiport.SrcAndDst && this.Match_Multiport.SrcAndDst.length > 0) {
                command += " -m multiport --port " + this.arr_to_commalst(this.Match_Multiport.SrcAndDst);
            } else {
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

        //#endregion

        //#region --state STATE

        if (!once_match && this.Match_State &&
            (this.Match_State.ESTABLISHED ||
            this.Match_State.NEW ||
            this.Match_State.INVALID ||
            this.Match_State.RELATED)) {
            command += " -m state --state " + this.stateToString(this.Match_State);
            once_match = true;
        }

        //#endregion

        //#region --tos TOS

        if (!once_match && this.Match_TOS &&
            this.tosToString(this.Match_TOS)) {
            command += " -m tos --tos " + this.tosToString(this.Match_TOS);
            once_match = true;
        }

        //#endregion

        //#region --ttl TTL

        if (!once_match && (this.Match_TTL > this.Match_TTL - 1)) {
            command += " -m ttl --ttl " + this.Match_TTL;
            once_match = true;
        }

        //#endregion

        /* TARGETS */

        var once_target = false;

        //#region -j ACCEPT

        if (!once_target && this.Target === Target_Type.ACCEPT) {
            command += " -j ACCEPT";
            once_target = true;
        }

        //#endregion

        //#region -j DROP

        if (!once_target && this.Target === Target_Type.DROP) {
            command += " -j DROP";
            once_target = true;
        }

        //#endregion

        //#region -j RETURN

        if (!once_target && this.Target === Target_Type.RETURN) {
            command += " -j RETURN";
            once_target = true;
        }

        //#endregion

        //#region -j MARK

        if (!once_target && this.Target === Target_Type.MARK) {
            if ((<IMarkOption>this.TargetOptions).SET_Mark !== undefined) {
                command += " -j MARK --set-mark " + (<IMarkOption>this.TargetOptions).SET_Mark;
                once_target = true;
            } else if ((<IMarkOption>this.TargetOptions).OR_Mark !== undefined) {
                command += " -j MARK --or-mark " + (<IMarkOption>this.TargetOptions).OR_Mark;
                once_target = true;
            } else if ((<IMarkOption>this.TargetOptions).AND_Mark !== undefined) {
                command += " -j MARK --and-mark " + (<IMarkOption>this.TargetOptions).AND_Mark;
                once_target = true;
            } else if ((<IMarkOption>this.TargetOptions).XOR_Mark !== undefined) {
                command += " -j MARK --xor-mark " + (<IMarkOption>this.TargetOptions).XOR_Mark;
                once_target = true;
            }
        }

        //#endregion

        //#region -j MASQUERADE

        if (!once_target && this.Target === Target_Type.MASQUERADE) {

            var _pt = "";

            if ((<IMasqueradeOption>this.TargetOptions)) {
                var port = (<IMasqueradeOption>this.TargetOptions).Port;
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

        //#endregion

        //#region -j REDIRECT

        if (!once_target && this.Target === Target_Type.REDIRECT &&
            this.IsEnabledForPort()
            && (<IRedirectOption>this.TargetOptions).Port
            && (<IRedirectOption>this.TargetOptions).Port.Id) {
            var _pt = "";
            _pt = " --to-ports " + (<IRedirectOption>this.TargetOptions).Port.Id;
            if ((<IRedirectOption>this.TargetOptions).Port.End) {
                _pt += "-" + (<IRedirectOption>this.TargetOptions).Port.End;
            }
            command += " -j REDIRECT" + _pt;
            once_target = true;
        }

        //#endregion

        //#region -j DNAT

        if (!once_target && this.Target === Target_Type.DNAT
            && (<IDNATOption>this.TargetOptions).To_Destination
            && (<IDNATOption>this.TargetOptions).To_Destination.Addr) {

            command += " -j DNAT --to-destination "
            + this.natAddrRangeToString((<IDNATOption>this.TargetOptions).To_Destination);

            once_target = true;
        }

        //#endregion

        //#region -j SNAT

        if (!once_target && this.Target === Target_Type.SNAT
            && (<ISNATOption>this.TargetOptions).To_Source
            && (<ISNATOption>this.TargetOptions).To_Source.Addr) {

            command += " -j SNAT --to-source "
            + this.natAddrRangeToString((<ISNATOption>this.TargetOptions).To_Source);

            once_target = true;
        }

        //#endregion

        //#region -j TOS

        if (!once_target && this.Target === Target_Type.TOS
            && (<ITOSOption>this.TargetOptions).TOS) {
            command += " -j TOS --set-tos " + this.tosToString((<ITOSOption>this.TargetOptions).TOS);
            once_target = true;
        }

        //#endregion

        //#region -j TTL

        if (!once_target && this.Target === Target_Type.TTL
            && ((<ITTLOption>this.TargetOptions).Set ||
            (<ITTLOption>this.TargetOptions).Decrement ||
            (<ITTLOption>this.TargetOptions).Increment)) {

            var op = (<ITTLOption>this.TargetOptions);
            if (op.Set) {
                command += " -j TTL --ttl-set " + op.Set;
            } else if (op.Decrement) {
                command += " -j TTL --ttl-dec " + op.Decrement;
            } else if (op.Increment) {
                command += " -j TTL --ttl-inc " + op.Increment;
            }

            once_target = true;
        }

        //#endregion


        //#region -j CONNMARK

        if (!once_target && this.Target === Target_Type.CONNMARK
            && ((<IConnMarkOption>this.TargetOptions).RestoreMark)) {

            var conmark = (<IConnMarkOption>this.TargetOptions);
            if (conmark.RestoreMark) {
                command += " -j CONNMARK --restore-mark";
            }
            once_target = true;
        }

        //#endregion


        //#region -j CHAIN

        if (!once_target && this.Target === Target_Type.CHAIN
            && ((<IChainOption>this.TargetOptions).Chain)) {
            command += " -j " + (<IChainOption>this.TargetOptions).Chain;
            once_target = true;
        }

        //#endregion

        return command;
    }
}

export var Iptables: Iptable_Base = new Iptable_Base();
export var Iptables_IPV6: Iptable_Base = new Iptable_Base();

export function Initialize(cb) {
    Iptables.Load();
    Iptables.Loaded(() => {
        Iptables_IPV6.SetExec("ip6tables");
        Iptables_IPV6.Load();
        Iptables_IPV6.Loaded(cb);
    });
}
//iptables -t nat -A POSTROUTING -p tcp -i ! eth+ -s 192.168.0.0/24 -j SNAT --to 172.16.4.6-192.168.1.1:10000-3999

//
// for f in /proc/sys/net/ipv4/conf/*/rp_filter; do echo 0 > $f; done
// echo 1 > /proc/sys / net / ipv4 / route / flush
//


/*
 * 
 * 
 * 
 * var masqETH = new Rule();
masqETH.Iface_Out = { Prefix : "eth", Id : 0 };
masqETH.Target = Target_Type.MASQUERADE;

var masqVPN = new Rule();
masqVPN.Iface_Out = { Prefix: "ppp", Id: 0 };
masqVPN.Target = Target_Type.MASQUERADE;
masqVPN.Match_Mark = { Value: "1" };

Iptables.NAT.POSTROUTING.Add(masqVPN, function () { });
Iptables.NAT.POSTROUTING.Add(masqETH, function () { });

var markVPN = new Rule();
markVPN.Source = { Addr: "192.168.9.3", Mask : "255.255.255.255" };
markVPN.Target = Target_Type.MARK;
markVPN.TargetOptions = { SET_Mark: "1" };


var markVPN2 = new Rule();
markVPN2.Source = { Addr: "192.168.9.132", Mask : "255.255.255.255" };
markVPN2.Target = Target_Type.MARK;
markVPN2.TargetOptions = { SET_Mark: "1" };

Iptables.Mangle.PREROUTING.Add(markVPN, function () { });
Iptables.Mangle.PREROUTING.Add(markVPN2, function () { });


 */


/*
 * ip route add default dev ppp0 table 200
 * ip rule add fwmark 0x01 table 200 
 */


