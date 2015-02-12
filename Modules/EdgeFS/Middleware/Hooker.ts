class HookerBase implements IHooker, IHook_Inside{

    private hookers = {
        init: [],
        destroy: [],
        statfs: [],
        getattr: [],
        readdir: [],
        readlink: [],
        unlink: [],
        chmod: [],
        create: [],
        mkdir: [],
        rmdir: [],
        open: [],
        read: [],
        write: [],
        release: [],
        rename: [],
        mount: [],
        umount: []
    };

    public finalize = () => {

        this.hookers = undefined;

    };

    private _hook_this(name, job) {

        if (!this.hookers.hasOwnProperty(name)) {
            throw new Error("EDGE_FUSE Unknown Func Name : " + name);
        }
        if (!Array.isArray(this.hookers[name])) {
            throw new Error("EDGE_FUSE Not array in hooker table :( " + name);
        }
        this.hookers[name].push(job);
    }

    init = (proxy: (cb: Callback, next?) => any) => {
        this._hook_this("init", proxy);
    };

    destroy = (proxy: (cb: Callback, next?) => any) => {
        this._hook_this("destroy", proxy);
    };

    statfs = (proxy: (cb: Callback, next?) => any) => {
        this._hook_this("statfs", proxy);
    };

    getattr = (proxy: (path: string, cb: Callback, next?) => any) => {
        this._hook_this("getattr", proxy);
    };

    readdir = (proxy: (path: string, cb: Callback, next?) => any) => {
        this._hook_this("init", proxy);
    };

    readlink = (proxy: (path: string, cb: Callback, next?) => any) => {
        this._hook_this("readlink", proxy);
    };

    unlink = (proxy: (path: string, cb: Callback, next?) => any) => {
        this._hook_this("unlink", proxy);
    };

    chmod = (proxy: (path: string, mode: number, cb: Callback, next?) => any) => {
        this._hook_this("chmod", proxy);
    };

    create = (proxy: (path: string, mode: number, cb: Callback, next?) => any) => {
        this._hook_this("create", proxy);
    };

    mkdir = (proxy: (path: string, mode: number, cb: Callback, next?) => any) => {
        this._hook_this("mkdir", proxy);
    };

    rmdir = (proxy: (path: string, cb: Callback, next?) => any) => {
        this._hook_this("rmdir", proxy);
    };

    open = (proxy: (path: string, flags: any, cb: Callback, next?) => any) => {
        this._hook_this("open", proxy);
    };

    read = (proxy: (path: string, offset: number, len: number, buf, fh: number, cb: Callback, next?) => any) => {
        this._hook_this("read", proxy);
    };

    write = (proxy: (path: string, offset: number, len: number, buf, fh: number, cb: Callback, next?) => any) => {
        this._hook_this("write", proxy);
    };

    release = (proxy: (path: string, fh: number, cb: Callback, next?) => any) => {
        this._hook_this("release", proxy);
    };

    rename = (proxy: (src: string, dst: string, cb: Callback, next?) => any) => {
        this._hook_this("rename", proxy);
    };

    mount = (proxy: (cb: Callback, next?) => any) => {
        this._hook_this("mount", proxy);
    };

    umount = (proxy: (cb: Callback, next?) => any) => {
        this._hook_this("umount", proxy);
    };

    use = (plugin: IFSInjector) => {
        plugin.apply(this);
    };

    start = (cb, umount_first?) => {
        var arg = arguments;
        if (umount_first) {
            this.stop((err) => {
                var t = setTimeout(() => {
                    clearTimeout(t);
                    this._init_call(arg, "mount");
                }, 400); //magic
            });
        }
        else {
            this._init_call(arg, "mount");
        }
    };
    
    stop = (cb) => {
        this._init_call(arguments, "umount");
    };

    autouse = (obj: any) => {
        var keys = Object.keys(obj);

        for (var i = 0; i < keys.length; i++) {
            if (this.hookers.hasOwnProperty(keys[i]) &&
                typeof obj[keys[i]] === 'function'
                ) {
                this._hook_this(keys[i], obj[keys[i]]);
            }
        }
    };

    private _one_and_next = (name, index, args: Array<any>, arglen) => {

        //console.log(name + " : " + index);
        if (this.hookers[name].length <= index) {
            var cb = <Function>args[arglen - 1];
            return cb(new Error(name + " falls through, no one handles this"));
        }
        var cur = <Function>this.hookers[name][index];
        if (!cur) {
            var cb = <Function>args[arglen - 1];
            return cb(new Error(name + " falls through, no one handles this"));
        }
        var next = () => {
            var _a = arguments;
            process.nextTick(() => {
                if (_a.length == 0) {
                    this._one_and_next(name, index + 1, args, arglen);
                } else {
                    this._one_and_next(name, index + 1, <any>_a, arglen);
                }
            });
        };
        args[arglen] = (next);
        //console.log((args));
        cur.apply(undefined, args);

    };

    public _init_call = (args, func) => {
        if (this.hookers[func] && this.hookers[func].length > 0) {
            var _copy: any = [];
            for (var i = 0; i < args.length; i++) {
                _copy[i] = args[i];
            }
            process.nextTick(() => {
                this._one_and_next(func, 0, _copy, args.length);
            });
        } else {
            var cb = <Function>args[args.length - 1];
            return cb(new Error("Handler not found : " + func));
        }
    };

    private _get_handler_for_func = (func) => {
        return () => {
            this._init_call(arguments, func);
        };
    };

    public GetFuseHandler = () : IBaseFS => {
        var keys = Object.keys(this.hookers);
        var handler = {};
        for (var i = 0; i < keys.length; i++) {
            handler[keys[i]] = this._get_handler_for_func(keys[i]);
        }
        return <IBaseFS>handler;
    };
}
exports = HookerBase;
export = HookerBase;