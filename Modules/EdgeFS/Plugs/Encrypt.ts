import pth = require('path');
import crypto = require("crypto");
import fs = require('fs');
var f4js = require('fuse4js');

//this is .. just a very simple piece of encryptor work..
//not for security, just to prevent runtime-data-cross-access 

var errnoMap = {
    EPERM: 1,
    EIO: 5,
    ENOENT: 2,
    ENOMEM: 12,
    EACCES: 13,
    EINVAL: 22,
    ENOTEMPTY: 39
};

function shuffle(array) {
    var m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

export class RotatingWheels implements IFSInjector {

    public static GenerateRings(order) {

        var rings = [], i = 0;
        for (; i < order; i++) {
            var arr = [];
            while (arr.push(arr.length) < 256); //gen array.. fast
            rings.push(shuffle(arr));
        }
        return rings;

    }

    private _transform_buffer = (prepender, offset, buf, len) => {
        

        var l = len > buf.length ? buf.length : len;

        var prep_offset = 0;
        for (var i = 0; i < prepender.length; i++) {
            var d = prepender[i].charCodeAt();
            var pos = ((d % 255) * (i % 255)) % 255;
            for (var t = 0; t < this._rings.length; t++) {
                pos = this._rings[t][pos];
            }
            prep_offset += pos;
        }

        prep_offset += offset;

        for (var i = 0; i < l; i++) {
            var pos = (prep_offset + i) % 255;
            for (var t = 0; t < this._rings.length; t++) {
                pos = this._rings[t][pos];
            }
            buf[i] = buf[i] ^ pos;
        }
        return buf;

    };

    private _rings: any[][];

    constructor(rings?) {
        this._rings = rings;
    }

    SetKeys = (rings) => {
        this._rings = rings;
    };

    GenerateKey = (order) => {
        this._rings = RotatingWheels.GenerateRings(order);
    };

    ExportKey = () => {
        return this._rings;
    };

    private write = (path: string, offset: number, len: number, buf, fh: number, cb: Callback, next) => {
        this._transform_buffer(path, offset, buf, len);
        next();
    };

    private read = (path: string, offset: number, len: number, buf, fh: number, cb: Callback, next) => {
        next(path, offset, len, buf, fh, (bytes) => {
            if (bytes < 0) return cb(bytes);
            buf.length = bytes;
            this._transform_buffer(path, offset, buf, bytes);
            return cb(bytes);
        });
    };

    apply = (hook: IHooker) => {
        //this._handler = hook.GetFuseHandler();
        //(<any>hook).autouse(this);
        hook.write(this.write);
        hook.read(this.read);
    };

}

