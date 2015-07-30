eval(LOG("Common:Native:iproute2"));

/****
 * 
 * !  CRAP ALERT  !
 * Someone is going to be able to fix this.
 * SOME ONE IS GOING TO FIX THIS
 * 
 * AND IF YOU WANT TO FIX THIS, FORK YOURSELF
 * 
 * Mike Luan 2014, Project Edge
 * 
 */

import child_process = require("child_process");
import events = require("events");
import fs = require("fs");
import Process = require("./Process");


export function Exec(tool: string, cmd: string, callback: ExecCallback) {
    info(tool.bold + " " + cmd);
    child_process.exec("ip " + tool + " " + cmd, (err, stdout, stderr) => {
        callback(err, {
            out: stdout.toString("utf8"),
            err: stderr.toString("utf8")
        });
    });
}

class ipmonitor extends Process {

    public static Neigh = new events.EventEmitter();

    public static Link = new events.EventEmitter();

    public static Addr = new events.EventEmitter();

    public static Instance: ipmonitor;

    constructor() {
        super("IPMONITOR");
    }

    Start(forever: boolean = true) {
        if (this.Process) {
            this.Process.kill(); //BOOOOM
        }
        var p = parsespawn_full("ip", ["monitor", "label"]);
        this.Process = p.process;
        p.event.on("out_line", this.Line_Raw);
        super.Start(forever);
    }

    private _prev_line_link;

    private Line_Raw = (data: string) => {
        //IT IS MESSY
        //deal with it..

        //DUAL LINE LOGIC GOES HERE
        if (this._prev_line_link != undefined) {
            this.Line_Link(this._prev_line_link, data);
            this._prev_line_link = undefined;
            return;
        }
        //DUAL LINE PROCESS ENDS

        //SINGLE LINE LOGIC STARTS NOW
        var tsplit = data.split(']');
        var type = tsplit[0].substr(1);
        var ln = tsplit[1];
        switch (type) {
            case 'NEIGH':
                this.Line_Neigh(ln);
                break;
            case 'LINK':
                this._prev_line_link = ln;
                break;
            case 'ADDR':
                this.Line_Addr(ln);
                break;
        }
    };

    private Line_Neigh = (line: string) => {
        //warn("!!! " + line); 
        /*
         * 192.168.222.2 dev eth0 lladdr 00:50:56:f9:a8:1b STALE
         * delete 224.0.0.251 dev wlan1 lladdr 01:00:5e:00:00:fb NOARP
         * delete 224.0.0.22 dev wlan1 lladdr 01:00:5e:00:00:16 NOARP
         * delete ff02::fb dev wlan1 lladdr 33:33:00:00:00:fb NOARP
         * delete ff02::1:ffb1:8d55 dev wlan1 lladdr 33:33:ff:b1:8d:55 NOA
         */
        if (line.substr(0, 6) == 'delete') {
            ipmonitor.Neigh.emit("SP_CHANGE", line);
            //ignored
        } else {
            //let's do event
            ipmonitor.Neigh.emit("CHANGE", line);
        }
    };

    private Line_Link = (line1: string, line2: string) => {
        if (line1.substr(0, 7) == 'Deleted') {
            ipmonitor.Link.emit("DELETE", line1.substring(8), line2);
        }
        else {
            ipmonitor.Link.emit("CHANGE", line1, line2);
        }
    };

    private Line_Addr = (line: string) => {
        if (line.substr(0, 7) == 'Deleted') {
            ipmonitor.Addr.emit("DELETE", line.substring(8));
        } else {
            //let's do event
            ipmonitor.Addr.emit("CHANGE", line);
        }
    };
}

export interface IFAddr {
    Address: string;
    Prefix: string;
}

class addr extends events.EventEmitter {

    public EVENT_LOAD = "load";

    public EVENT_LOADEND = "loadend";

    public EVENT_RECORD_NEW = "new";

    public EVENT_RECORD_DEL = "del";

    public static Instance: addr;

    private Prefix = "addr";

    //Interface -> IP[]
    public Interfaces: IDic<IFAddr[]> = {};

    //calls flush -> calls add SAFE 
    public Set_Flush = (dev: string, ADDR: IFAddr, callback: ExecCallback) => {
        if (!this.Interfaces[dev]) {
            callback(new Error(dev + " does not exist"), { out: "", err: "" });
        }
        else {
            Exec(this.Prefix, "flush dev " + dev, () => {
                Exec(this.Prefix, "add dev " + dev + " " + ADDR.Address + "/" + ADDR.Prefix, callback);
            });
        }
    };

    public Change = (dev: string, addr_before: IFAddr, addr_after: IFAddr, callback: ExecCallback) => {
        if (!this.Interfaces[dev]) {
            callback(new Error(dev + " does not exist"), { out: "", err: "" });
        }
        else {
            Exec(this.Prefix, "del " + addr_before.Address + "/" + addr_before.Prefix + " dev " + dev, () => {
                Exec(this.Prefix, "add dev " + dev + " " + addr_after.Address + "/" + addr_after.Prefix, callback);
            });
        }
    };

    public Add = (dev: string, addr: IFAddr, callback: ExecCallback) => {
        if (!this.Interfaces[dev]) {
            callback(new Error(dev + " does not exist"), { out: "", err: "" });
        }
        else {
            Exec(this.Prefix, "add dev " + dev + " " + addr.Address + "/" + addr.Prefix, callback);
        }
    };

    public Debug_Output = () => {

        info(" +------ ");
        for (var dev in this.Interfaces) {
            for (var i = 0; i < this.Interfaces[dev].length; i++) {
                info(" | " + dev + " ~ " + JSON.stringify(this.Interfaces[dev][i]));
            }
        }
        info(" +------ ");

    };

    private OnChange = (line: string) => {
        var sp = line.split(" ");
        var id = sp[1].split(':')[0];
        if (!this.Interfaces[id]) {
            this.Interfaces[id] = [];
        }
        /**
         * 2: eth0    inet6 fe80::20c:29ff:fee0:41bf/64 scope link 
            valid_lft forever preferred_lft forever
         * 
         * 
         */
        /*3:,wlan1,,,,inet,192.168.9.2/24,brd,192.168.9.255,scope,global,wlan1*/
        var ifa = sp[6].split('/');
        var index = this.Interfaces[id].push({
            Address: ifa[0],
            Prefix: ifa[1]
        });

        this.emit(this.EVENT_RECORD_NEW, id, index, this.Interfaces[id][index]);
        //this.Debug_Output();
    };

    private OnDelete = (line: string) => {
        var sp = line.split(" ");
        var id = sp[1].split(':')[0];
        if (!this.Interfaces[id]) {
            return;
        } else {
            var ifa = sp[6].split('/');
            var n = [];
            for (var i = 0; i < this.Interfaces[id].length; i++) {
                if (this.Interfaces[id][i].Address !== ifa[0]
                    && this.Interfaces[id][i].Prefix !== ifa[1]) {
                    n.push(this.Interfaces[id][i]);
                }
            }
            this.emit(this.EVENT_RECORD_DEL, id);
            this.Interfaces[id] = n;
            this.Debug_Output();
            return;
        }
    };

    public Get(dev): IFAddr[] {
        return this.Interfaces[dev];
    }

    public Load = (callback) => {
        /*
         * 2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
         *         link/ether 00:0c:29:a2:13:38 brd ff:ff:ff:ff:ff:ff
         *         inet 192.168.222.129/24 brd 192.168.222.255 scope global eth0
         *            valid_lft forever preferred_lft forever
         *         inet6 fe80::20c:29ff:fea2:1338/64 scope link 
         *            valid_lft forever preferred_lft forever
         * 
         */
        this.Interfaces = {};
        this.emit(this.EVENT_LOAD);
        Exec(this.Prefix, "show", (err, result) => {
            if (!err && result.out) {
                var lines = result.out.trim().split('\n');
                var _interface;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].charAt(0) != " ") {
                        _interface = lines[i].split(':')[1].trim();
                        this.Interfaces[_interface] = [];
                    }
                    else {
                        var ln = lines[i].trim();
                        if (ln.substr(0, 4) == "inet") {
                            var a = ln.split(' ')[1].split('/');
                            this.Interfaces[_interface].push({
                                Prefix: a[1],
                                Address: a[0]
                            });
                        }
                    }
                    this.emit(this.EVENT_RECORD_NEW, _interface);
                }
            }
            callback(err, result);
            this.Debug_Output();
            this.emit(this.EVENT_LOADEND, this.Interfaces);
        });
    };

    constructor() {
        super();

        ipmonitor.Addr.on("CHANGE", this.OnChange);
        ipmonitor.Addr.on("DELETE", this.OnDelete);

        trace("Initialize");
        addr.Instance = this;
    }
}

class neigh extends events.EventEmitter {

    private WatchList: IDic<{ func: Function; dev: string }> = {};

    public EVENT_LOAD = "load";

    public EVENT_LOADEND = "loadend";

    public EVENT_RECORD_NEW = "new";

    public EVENT_RECORD_CHANGE = "change";

    public EVENT_RECORD_DEL = "del";

    public static Instance: neigh;

    public MacList: IDic<NeighRecord> = {}; //IP CHANGES, MAC WONT!

    public IpList: IDic<NeighRecord>  = {}; //IP CHANGES, MAC WONT!

    private Prefix = "neigh";

    public Delete = (n: NeighRecord, callback: ExecCallback) => {
        var cmd = "del " + NeighRecord.toCommandString(n);
        Exec(this.Prefix, cmd, callback);
    };

    public Add = (n: NeighRecord, callback: ExecCallback) => {
        var cmd = "add " + NeighRecord.toCommandString(n);
        Exec(this.Prefix, cmd, callback);
    };

    public Update = (n: NeighRecord, callback: ExecCallback) => {
        var cmd = "replace " + NeighRecord.toCommandString(n);
        Exec(this.Prefix, cmd, callback);
    };

    public Load = (callback: ExecCallback) => {
        this.MacList = {};
        this.emit(this.EVENT_LOAD);
        Exec(this.Prefix, "show", (err, result) => {
            if (!err && result.out) {
                var lines = result.out.toLowerCase().trim().split('\n');
                for (var i = 0; i < lines.length; i++) {
                    var n = (NeighRecord.FromLine(lines[i]));
                    if (n && !NeighRecord.IsDead(n)) {
                        this.MacList[n.Mac] = n;
                    }
                }
            }
            callback(err, result);
            this.emit(this.EVENT_LOADEND, this.MacList);
        });
    };

    //not used
    public SweepDead = () => {
        for (var mac in this.MacList) {
            if (NeighRecord.IsDead(this.MacList[mac])) {
                this.emit(this.EVENT_RECORD_DEL, this.MacList[mac]);
                delete this.MacList[mac];
            }
        }
    };

    public Debug_Output = () => {

        info(" +------ ");
        for (var mac in this.MacList) {
            info(" | " + NeighRecord.toCommandString(this.MacList[mac]));
        }
        info(" +------ ");

    };

    private OnChange = (line) => {
        var n = new NeighRecord();
        NeighRecord.Apply(n, line);
        if (NeighRecord.IsDead(n)) {
            //mac doesnot exist on incoming line
            for (var mac in this.MacList) {
                if (this.MacList[mac].Address == n.Address) {

                    delete this.IpList[n.Address];
                    this.emit(this.EVENT_RECORD_DEL, this.MacList[mac]);

                    if (this.WatchList[mac]) {
                        warn("Check if we can add DEV filter here");
                        this.WatchList[mac].func(n);
                    }

                    delete this.MacList[mac];

                }
            }
        } else if (this.MacList[n.Mac]) {

            var cur: NeighRecord = this.MacList[n.Mac];
            if (this.WatchList[n.Mac] &&
                (this.WatchList[n.Mac].dev == undefined ||
                this.WatchList[n.Mac].dev == n.Dev)) {

                var next = n;
                if (NeighRecord.IsAlive(cur) != NeighRecord.IsAlive(next) &&
                    cur.Address != next.Address) {
                    this.WatchList[n.Mac].func(n);
                }
            }

            this.IpList[n.Address] = n;
            this.MacList[n.Mac] = n;
            this.emit(this.EVENT_RECORD_CHANGE, this.MacList[n.Mac], cur);

        } else if (!this.MacList[n.Mac]) {
            this.MacList[n.Mac] = n;
            this.IpList[n.Address] = n;
            this.emit(this.EVENT_RECORD_NEW, this.MacList[n.Mac]);
            if (this.WatchList[n.Mac] &&
                (this.WatchList[n.Mac].dev == undefined ||
                this.WatchList[n.Mac].dev == n.Dev)) {
                this.WatchList[n.Mac].func(n);
            }
        }
        //this.Debug_Output();

    };

    public Exist(mac): boolean {
        return this.Get(mac) != undefined;
    }

    public Get(mac): NeighRecord {
        return this.MacList[mac];
    }

    public Watch(mac, callback: (addr?: NeighRecord) => any) {
        this.WatchList[mac] = {
            func: callback,
            dev: undefined
        };
    }

    public WatchWithDev(dev, mac, callback: (addr?: NeighRecord) => any) {
        this.WatchList[mac] = {
            func: callback,
            dev: dev
        };
    }

    public Unwatch(mac) {
        delete this.WatchList[mac];
    }

    public GetByAddress_Array(addr): NeighRecord[] {
        var t = [];
        for (var mac in this.MacList) {
            if (this.MacList[mac].Address == addr) {
                t.push(this.MacList[mac]);
            }
        }
        return t;
    }

    public GetByAddress_First(addr): NeighRecord {
        return <NeighRecord>this.IpList[addr];
    }

    public GetByAddress_First_ActiveProbe(addr, callback: PCallback<NeighRecord>) {
        var ping = child_process.spawn("ping", ["-c", "3", addr]);
        ping.on('close', () => {
            callback(undefined, <NeighRecord>this.IpList[addr]);
        });
    }

    /**
     * Please check result type
     */
    public GetByAddress(addr): any {
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
                } else {
                    result = this.MacList[mac];
                }
            }
        }
        return result;
    }

    constructor() {
        super();

        ipmonitor.Neigh.on("CHANGE", this.OnChange);

        info("Initialize");
        neigh.Instance = this;
    }
}

export class NeighRecord {

    static MASK_ALIVE = 1 << 4;
    static MASK_DEAD = 1 << 5;
    static MASK_UNDETERMINED = 1 << 6;

    Address: string; //: IPAddress
    Dev: string; //: IDev
    Mac: string; //: IMacAddr
    NUD: NUDState;

    public static IsAlive (record: NeighRecord) {
        return (record.NUD & NeighRecord.MASK_ALIVE) > 0;
    }

    public static IsDead(record: NeighRecord) {
        return (record.NUD & NeighRecord.MASK_DEAD) > 0;
    }

    public static IsUndetermined(record: NeighRecord) {
        return (record.NUD & NeighRecord.MASK_UNDETERMINED) > 0;
    }

    public static FromLine(line: string): NeighRecord {

        //192.168.222.2 dev eth0 lladdr 00:50:56:f9:a8:1b REACHABLE
        var l = line.toLowerCase().split(' ');
        if (l.length < 4)
            return undefined;
        else {
            var nei = new NeighRecord();
            NeighRecord.Apply(nei, line);
            return nei;
        }
    }

    public static Apply(record: NeighRecord, line: string) {

        //192.168.222.2 dev eth0 lladdr 00:50:56:f9:a8:1b REACHABLE
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
    }

    public static toCommandString(neigh: NeighRecord) {

        var result = neigh.Address;
        if (neigh.Dev) {
            result += " dev " + neigh.Dev;
        }
        if (neigh.Mac) {
            result += " lladdr " + neigh.Mac;
        }
        return result;
    }

}

export enum NUDState {

    NONE = 0 | NeighRecord.MASK_DEAD,
    INCOMPLETE = 0 | NeighRecord.MASK_UNDETERMINED,
    REACHABLE = 0 | NeighRecord.MASK_ALIVE,
    STALE = 1 | NeighRecord.MASK_ALIVE,
    DELAY = 2 | NeighRecord.MASK_ALIVE,
    PROBE = 1 | NeighRecord.MASK_UNDETERMINED,
    FAILED = 1 | NeighRecord.MASK_DEAD,
    NOARP = 3 | NeighRecord.MASK_ALIVE,
    PERMANENT  = 2 | NeighRecord.MASK_UNDETERMINED,

}

class link extends events.EventEmitter {

    public EVENT_LOAD = "load";
           
    public EVENT_LOADEND = "loadend";
           
    public EVENT_RECORD_NEW = "new";
           
    public EVENT_RECORD_CHANGE = "change";
           
    public EVENT_RECORD_DEL = "del";

    public static Instance: link;

    private Prefix = "link";

    public Interfaces: IDic<LinkInterface> = {};

    public Add = (link: LinkInterface, callback: ExecCallback) => {
        warn("!NOT IMPLEMENTED - VLAN SUPPORT!");
    };

    public Power = (dev: string, power: boolean, callback: ExecCallback) => {
        if (!this.Interfaces[dev]) {
            callback(new Error(dev + " does not exist"), { out: "", err: "" });
        }
        else {
            Exec(this.Prefix, "set " + dev + " " + (power ? "up" : "down"), callback);
        }
    };

    public Debug_Output = () => {

        trace(" +------ ");
        for (var dev in this.Interfaces) {
            trace(" | " + dev + " ~ " + JSON.stringify(this.Interfaces[dev].Status));
        }
        trace(" +------ ");

    };

    private OnChange = (line: string, line2: string) => {

        var id = line.split(":")[0];
        for (var i in this.Interfaces) {
            if (this.Interfaces[i].Id == id) {
                this.Interfaces[i].Apply(line, line2);
                this.emit(this.EVENT_RECORD_CHANGE, i, this.Interfaces[i]);
                //this.Debug_Output();
                return;
            }
        }
        var p = new LinkInterface();
        p.Apply(line, line2);
        this.Interfaces[p.Dev] = p;
        this.emit(this.EVENT_RECORD_NEW, p);
        //this.Debug_Output();

    };

    private OnDelete = (line: string, line2: string) => {

        var id = line.split(":")[0];
        for (var i in this.Interfaces) {
            if (this.Interfaces[i].Id == id) {
                var cache = this.Interfaces[i];
                cache.Apply(line, line2);
                delete this.Interfaces[i];
                this.emit(this.EVENT_RECORD_DEL, i, cache);
                //this.Debug_Output();
                return;
            }
        }
        //ignore

    };

    public Get(dev): LinkInterface {
        return this.Interfaces[dev];
    }

    public Load = (callback) => {
        this.Interfaces = {};
        
        this.emit(this.EVENT_LOAD);
        Exec(this.Prefix, "show", (err, result) => {
            if (!err && result.out) {
                var lines = result.out.trim().split('\n');
                for (var i = 0; i < lines.length; i += 2) {
                    var t = new LinkInterface();
                    t.Apply(lines[i], lines[i + 1]);
                    this.Interfaces[t.Dev] = t;
                    this.emit(this.EVENT_RECORD_NEW);
                }
            }
            callback(err, result);
            this.Debug_Output();
            this.emit(this.EVENT_LOADEND, this.Interfaces);
        });
    };

    constructor() {
        super();

        ipmonitor.Link.on("CHANGE", this.OnChange);
        ipmonitor.Link.on("DELETE", this.OnDelete);

        trace("Initialize");
        link.Instance = this;
    }
}

export class LinkInterface {

    State: string;
    Dev: string; //: IDev
    Mac: string; //: IMacAddr
    MacMask: string; //: IMacAddr
    Status: any = {}; // <BROADCAST,MULTICAST,UP,LOWER_UP>
    Id: string;


    public IsUp = () => {
        return this.Status["UP"] !== undefined;
    };

    public Apply(line1: string, line2: string) {

        //2: eth0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc pfifo_fast state DOWN group default 
        //NUMBER INTERFACE STATUS "MTU" MTU "QDISK" QDISK "STATE" STATE "GROUP" GROUP
        //link/ether 00:0c:29:a2:13:38 brd ff:ff:ff:ff:ff:ff
        //"LINK/ETHER" MAC "BRD" MASK

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
    }

}


export var Addr: addr;
export var Link: link;
export var Neigh: neigh;

export function Initialize(cb) {
    trace("Initializing");
    Addr = new addr();
    Link = new link();
    Neigh = new neigh();
    async.series([
        addr.Instance.Load,
        neigh.Instance.Load,
        link.Instance.Load
    ], () => {
            ipmonitor.Instance = new ipmonitor();
            ipmonitor.Instance.Start(true);
            cb();
    });
}


