import pth = require('path');
import fs = require('fs');
var f4js:any = require('fuse4js');
var du:any = require("du");
import su_umount = require("../_Helper/umount");

function convertOpenFlags(openFlags): any {
    switch (openFlags) {
        case 32768:
            return 'r';
        case 32769:
            return 'w';
        case 32770:
            return 'r+';
        case 33794:
            return 'a+';
        case 33793:
            return 'a';
        case 1085442:
            return 'rs+';
    }
}

var errnoMap = {
    EPERM: 1,
    ENOENT: 2,
    EACCES: 13,
    EINVAL: 22,
    ENOTEMPTY: 39
};

function excToErrno(exc) {
    var errno = errnoMap[exc.code];
    if (!errno)
        errno = errnoMap.EPERM; // default to EPERM
    return errno;
}


export class Mirror implements IFSInjector {

    private mountPoint: string;

    private srcRoot: string;

    private _handler: any;

    private _size: number;

    constructor(source, mountPoint) {
        this.srcRoot = source;
        this.mountPoint = mountPoint;
    }

    public GetMountPoint() {
        return this.mountPoint;
    }

    public GetSrcRoot() {
        return this.srcRoot;
    }

    public SetMountPoint(mount) {
        this.mountPoint = mount;
    }

    public SetSrcRoot(src) {
        this.srcRoot = src;
    }

    private init = (cb: Callback) => {
        console.log("File system started at " + this.mountPoint);
        cb();
    };

    private destroy = (cb: Callback) => {
        console.log("File system stopped");
        cb();
    };

    private statfs = (cb: Callback) => {
        cb(0, {
            bsize: 1000000,
            frsize: 1000000,
            blocks: 1000000,
            bfree: 1000000,
            bavail: 1000000,
            files: 1000000,
            ffree: 1000000,
            favail: 1000000,
            fsid: 1000000,
            flag: 1000000,
            namemax: 1000000
        });
    };

    private getattr = (path: string, cb: Callback) => {
        var path = pth.join(this.srcRoot, path);
        return fs.lstat(path, function lstatCb(err, stats) {
            if (err)
                return cb(-excToErrno(err));
            return cb(0, stats);
        });
    };

    private readdir = (path: string, cb: Callback) => {
        var path = pth.join(this.srcRoot, path);
        return fs.readdir(path, function readdirCb(err, files) {
            if (err)
                return cb(-excToErrno(err));
            return cb(0, files);
        });
    };

    private readlink = (path: string, cb: Callback) => {
        var path = pth.join(this.srcRoot, path);
        return fs.readlink(path, function readlinkCb(err, name) {
            if (err)
                return cb(-excToErrno(err));
            var name = pth.resolve(this.srcRoot, name);
            return cb(0, name);
        });
    };

    private unlink = (path: string, cb: Callback) => {
        var path = pth.join(this.srcRoot, path);
        fs.lstat(path, (err, stats) => {
            if (err) {
                return cb(-excToErrno(err));
            }
            var cursize = stats.size;
            fs.unlink(path, (err) => {
                if (err)
                    return cb(-excToErrno(err));
                this._size -= cursize;
                cb(0);
            });
        });
    };

    private chmod = (path: string, mode: number, cb: Callback) => {
        var path = pth.join(this.srcRoot, path);
        return fs.chmod(path, mode, function chmodCb(err) {
            if (err)
                return cb(-excToErrno(err));
            return cb(0);
        });
    };

    private create = (path: string, mode: number, cb: Callback) => {
        var path = pth.join(this.srcRoot, path);
        fs.open(path, 'w', mode, function openCb(err, fd) {
            if (err)
                return cb(-excToErrno(err));
            cb(0, fd);
        });
    };

    private mkdir = (path: string, mode: number, cb: Callback) => {
        path = pth.join(this.srcRoot, path);
        fs.mkdir(path, mode, (err) => {
            if (err)
                return cb(-excToErrno(err));
            this._size += 4096;
            cb(0);
        });
    };

    private rmdir = (path: string, cb: Callback) => {
        path = pth.join(this.srcRoot, path);
        fs.rmdir(path, (err) => {
            if (err)
                return cb(-excToErrno(err));
            this._size -= 4096;
            cb(0);
        });
    };

    private open = (path: string, flags: any, cb: Callback) => {
        var path = pth.join(this.srcRoot, path);
        //var flags = convertOpenFlags(flags);
        fs.open(path, flags, parseInt("0666", 8), function openCb(err, fd) {
            if (err)
                return cb(-excToErrno(err));
            cb(0, fd);
        });
    };

    private read = (path: string, offset: number, len: number, buf, fh: number, cb: Callback) => {
        fs.read(fh, buf, 0, len, offset, function readCb(err, bytesRead, buffer) {
            if (err)
                return cb(-excToErrno(err));
            cb(bytesRead);
        });
    };

    private write = (path: string, offset: number, len: number, buf, fh: number, cb: Callback) => {
        fs.write(fh, buf, 0, len, offset, (err, bytesWritten, buffer) => {
            if (err)
                return cb(-excToErrno(err));
            this._size += bytesWritten;
            cb(bytesWritten);
        });
    };

    private release = (path: string, fh: number, cb: Callback) => {
        fs.close(fh, function closeCb(err) {
            if (err)
                return cb(-excToErrno(err));
            cb(0);
        });
    };

    private rename = (src: string, dst: string, cb: Callback) => {
        src = pth.join(this.srcRoot, src);
        dst = pth.join(this.srcRoot, dst);
        fs.rename(src, dst, function renameCb(err) {
            if (err)
                return cb(-excToErrno(err));
            cb(0);
        });
    };

    private mount = (cb: Callback) => {
        du(this.srcRoot, (err, size) => {
            if (err) {
                return cb(err);
            }
            else {
                this._size = size;
                try {
                    f4js.start(this.mountPoint, this._handler, false);
                    cb();
                } catch (e) {
                    cb(e);
                }
            }
        });

    };

    private umount = (cb: Callback) => {
        //child_process.exec("( fusermount -u " + this.mountPoint + " & )",  (err, stdOut, stdErr) => {
        //    console.log(err);
        //    console.log(stdOut.toString());
        //    console.log(stdErr.toString());
        //    cb(err);
        //});
        su_umount.umount(this.mountPoint, cb);
        
    };

    public apply = (hook: IHooker) => {
        this._handler = hook.GetFuseHandler();
        (<any>hook).autouse(this);
    };

    public Size = () => {
        return this._size;
    };
}

