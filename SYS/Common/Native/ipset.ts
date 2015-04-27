import child_process = require("child_process");
var spawn = child_process.spawn;
var exec = child_process.exec;
import events = require("events");

export var Sets = {};
export function Initialize(callback) {
    //FLUSH EVERYTHING (TOIIIILET)
    info("Initializing");
    RawCommand("x", "", () => {
        trace("UP".bold);
        callback();
    });
}

export function RawCommand(command, arg, callback: PCallback<any>) {
    info("COMMAND > " + command + " " + arg);
    exec("ipset " + command + " " + arg, (err, stdout, stderr) => {
        if (!stderr || stderr.toString() == "") {
            callback(undefined, stdout.toString());
        } else {
            callback(new Error(stderr.toString()), stdout.toString());
        }
    });
}


export class SetItemBase {

    timeout: any;

    packets: any;

    bytes: any;

    nomatch: any;

    toOptionString() {
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
    }

}

export class SetBase<T extends SetItemBase> {

    List: IDic<T> = {};

    constructor(public SetType: string, public Name: string, public Opt: string, public Timeout = false, public Counter = true) {
        if (Sets[Name]) {
            throw new Error("Set Exists");
        }
        //TIMEOUT, COUNTER, BYTE
        var OPT = "";
        OPT += Timeout ? " timeout 0" : "";
        OPT += Counter ? " counters" : "";
        RawCommand("create", this.Name + " " + this.SetType + " " + Opt + " " + OPT, (err) => { });
        Sets[Name] = this;
    }

    Add(item: T, callback) {
        if (this.List[item.toOptionString()]) {
            return callback(new Error("ITEM EXISTS!"), item);
        }
        RawCommand("add " + this.Name, item.toOptionString(), (err, data) => {
            this.List[item.toOptionString()] = item;
            return callback(err, data);
        });
    }

    Delete(item: T, callback) {
        if (!this.List[item.toOptionString()]) {
            return callback(new Error("ITEM DOES NOT EXIST"), item);
        }
        RawCommand("del " + this.Name, item.toOptionString(), (err, data) => {
            delete this.List[item.toOptionString()];
            callback(err, data);
        });
    }

    Destroy(callback) {
        RawCommand("x", this.Name, (err, data) => {
            if (!err) {
                delete Sets[this.Name];
            }
        });
    }
}


export class BitmapIp_SetItem extends SetItemBase {

    public ip: string = "";

    public fromIp_toIp: string = "";

    public ip_cidr: string = "";

    toOptionString() {
        return this.ip + this.fromIp_toIp + this.ip_cidr + super.toOptionString();
    }
}


export class BitmapIp_Set extends SetBase<BitmapIp_SetItem> {

    static SETTYPE: string = "bitmap:ip";

    Range: string = "";

    Mask: string = "";

    static Create(name, range, netmask, timeout = false, counter = true): BitmapIp_Set {

        var option = "range " + range;
        if (netmask && netmask.trim() !== "") {
            option += " netmask " + netmask;
        }

        var SET = new BitmapIp_Set(BitmapIp_Set.SETTYPE, name, option, timeout, counter);
        SET.Range = range;
        SET.Mask = netmask;
        return SET;

    }
}


export class BitmapIpMac_SetItem extends SetItemBase {

    public ip: string = "";

    public mac: string = "";

    toOptionString() {
        return this.ip + (this.mac ? (":" + this.mac) : "") + super.toOptionString();
    }
}


export class BitmapIpMac_Set extends SetBase<BitmapIpMac_SetItem> {

    static SETTYPE: string = "bitmap:ip,mac";

    Range: string = "";

    static Create(name, range, timeout = false, counter = true): BitmapIpMac_Set {
        var option = "range " + range;
        var SET = new BitmapIpMac_Set(BitmapIpMac_Set.SETTYPE, name, option, timeout, counter);
        SET.Range = range;
        return SET;
    }
}

export class BitmapPort_SetItem extends SetItemBase {

    public port: string = "";

    public portRange: string = "";

    toOptionString() {
        return (this.port ? this.port : this.portRange) + super.toOptionString();
    }
}


export class BitmapPort_Set extends SetBase<BitmapPort_SetItem> {

    static SETTYPE: string = "bitmap:port";

    fromPort: string = "";

    toPort: string = "";

    static Create(name, fromPort, toPort, timeout = false, counter = true): BitmapPort_Set {
        var option = "range " + fromPort + "-" + toPort;
        var SET = new BitmapPort_Set(BitmapPort_Set.SETTYPE, name, option, timeout, counter);
        SET.fromPort = fromPort;
        SET.toPort = toPort;
        return SET;
    }
}


export class HashIp_SetItem extends SetItemBase {

    public ip: string = "";

    public fromIp_toIp: string = "";

    public ip_cidr: string = "";

    toOptionString() {
        return this.ip + this.fromIp_toIp + this.ip_cidr + super.toOptionString();
    }
}


export class HashIp_Set extends SetBase<HashIp_SetItem> {

    static SETTYPE: string = "hash:ip";

    Mask: string = "";

    static Create(name, mask, timeout = false, counter = true): HashIp_Set {
        var option = "netmask " + mask;
        var SET = new HashIp_Set(HashIp_Set.SETTYPE, name, option, timeout, counter);
        SET.Mask = mask;
        return SET;
    }
}


export class HashNet_SetItem extends SetItemBase {

    public fromIp_toIp: string = "";

    public ip_cidr: string = "";

    toOptionString() {
        return this.fromIp_toIp + this.ip_cidr + super.toOptionString();
    }
}


export class HashNet_Set extends SetBase<HashNet_SetItem> {

    static SETTYPE: string = "hash:net";

    static Create(name, timeout = false, counter = true): HashNet_Set {
        var SET = new HashNet_Set(HashNet_Set.SETTYPE, name, "", timeout, counter);
        return SET;
    }

}