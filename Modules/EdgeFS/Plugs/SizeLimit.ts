import pth = require('path');
import fs = require('fs');
var f4js = require('fuse4js');

var errnoMap = {
    EPERM: 1,
    EIO: 5,
    ENOENT: 2,
    ENOMEM: 12,
    EACCES: 13,
    EINVAL: 22,
    ENOTEMPTY: 39
};

export class SizeLimit implements IFSInjector {

    private getSize: Function;

    private limit: number = -1;

    constructor(get_size: () => number, limit?) {
        this.getSize = get_size;
        if (limit !== undefined) {
            this.SetLimit(limit);
        }
    }

    public GetLimit = () => { return this.limit; };

    public SetLimit = (l) => {
        if (l) {
            console.log("Limit sets to [ " + l + " ]");
            this.limit = l;
        } else {
            console.log("Limit sets to NONE");
            this.limit = -1;
        }
    };

    private write = (path: string, offset: number, len: number, buf, fh: number, cb: Callback, next) => {
        if (this.limit < 0 || ((offset + len) + this.getSize()) <= this.limit) {
            return next();
        }
        return cb(-errnoMap.ENOMEM);
    };

    private mkdir = (path: string, mode: number, cb: Callback, next) => {
        if (this.limit < 0 || ((4096) + this.getSize()) <= this.limit) {
            return next();
        }
        return cb(-errnoMap.ENOMEM);
    };

    apply = (hook: IHooker) => {
        hook.mkdir(this.mkdir);
        hook.write(this.write);
    };

}

