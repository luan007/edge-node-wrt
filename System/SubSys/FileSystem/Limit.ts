import Core = require("Core");
import Node = require("Node");

export interface IQuotaOption {
    user?: string;
    group?: string;
    size_hard?: number; //kb
    size_soft?: number; //kb
    inode_hard?: number;
    inode_soft?: number;
}

export interface IQuotaStatus extends IQuotaOption {
    //root      -- 3067280       0       0    0     167191     0     0     0  
    size_used: number;
    inode_used: number;
    size_grace: number;
    inode_grace: number;
}

export function SetQuota(options: IQuotaOption, cb, quota_fs = "/") {
    if (options.user || options.group) {
        var queue = intoQueue("SETQUOTA",
            //untilNoError(
            async.series.bind(null, [
                exec.bind(null, "setquota", options.user ? "-u" : "-g",
                    options.user ? options.user : options.group,
                    options.size_soft ? options.size_soft : 0,
                    options.size_hard ? options.size_hard : 0,
                    options.inode_soft ? options.inode_soft : 0,
                    options.inode_hard ? options.inode_hard : 0,
                    quota_fs),
                exec.bind(null, "quotaoff", options.user ? "-u" : "-g", quota_fs),
                exec.bind(null, "quotaon", options.user ? "-u" : "-g", quota_fs)
            ]), cb);
        trace("SetQuota @ " + queue);
    }
    else {
        return cb(new Error("User/Group is not specified"));
    }
}

export function GetUserLimit(name, cb, quota_fs = "/") {
    var sp = parsespawn("repquota", [quota_fs]);
    cb = once(cb);
    sp.on("exit", () => {
        cb();
    });
    sp.on("out_line", (line) => {
        var u = parseLimit(line);
        if (u.user == name)
            return cb(undefined, u);
    });
}

function parseLimit(line, is_user = true): IQuotaStatus {
    try {
        var sp = line.split(/\s+/);
        var result: IQuotaStatus = {
            user: is_user ? sp[0] : undefined,
            group: !is_user ? sp[0] : undefined,
            size_used: Number(sp[2]),
            size_soft: Number(sp[3]),
            size_hard: Number(sp[4]),
            size_grace: Number(sp[5]),
            inode_used: Number(sp[6]),
            inode_soft: Number(sp[7]),
            inode_hard: Number(sp[8]),
            inode_grace: Number(sp[9])
        };
        return result;
    } catch (e) {
        return undefined;
    }
}



