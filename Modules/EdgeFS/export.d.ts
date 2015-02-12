interface IBaseFS {
    init(cb: Callback);
    destroy(cb: Callback);
    statfs(cb: Callback);
    getattr(path: string, cb: Callback);
    readdir(path: string, cb: Callback);
    readlink(path: string, cb: Callback);
    unlink(path: string, cb: Callback);
    chmod(path: string, mode: number, cb: Callback);
    create(path: string, mode: number, cb: Callback);
    mkdir(path: string, mode: number, cb: Callback);
    rmdir(path: string, cb: Callback);
    open(path: string, flags: string, cb: Callback);
    read(path: string, offset: number, len: number, buf, fh: number, cb: Callback);
    write(path: string, offset: number, len: number, buf, fh: number, cb: Callback);
    release(path: string, fh: number, cb: Callback);
    rename(src: string, dst: string, cb: Callback);
    mount(cb: Callback);
    umount(cb: Callback);
}


interface IHooker {

    init(proxy: (cb: Callback, next?) => any);

    destroy(proxy: (cb: Callback, next?) => any);

    statfs(proxy: (cb: Callback, next?) => any);

    getattr(proxy: (path: string, cb: Callback, next?) => any);

    readdir(proxy: (path: string, cb: Callback, next?) => any);

    readlink(proxy: (path: string, cb: Callback, next?) => any);

    unlink(proxy: (path: string, cb: Callback, next?) => any);

    chmod(proxy: (path: string, mode: number, cb: Callback, next?) => any);

    create(proxy: (path: string, mode: number, cb: Callback, next?) => any);

    mkdir(proxy: (path: string, mode: number, cb: Callback, next?) => any);

    rmdir(proxy: (path: string, cb: Callback, next?) => any);

    open(proxy: (path: string, flags: any, cb: Callback, next?) => any);

    read(proxy: (path: string, offset: number, len: number, buf, fh: number, cb: Callback, next?) => any);

    write(proxy: (path: string, offset: number, len: number, buf, fh: number, cb: Callback, next?) => any);

    release(proxy: (path: string, fh: number, cb: Callback, next?) => any);

    rename(proxy: (src: string, dst: string, cb: Callback, next?) => any);

    mount(proxy: (cb: Callback, next?) => any);

    umount(proxy: (cb: Callback, next?) => any);

    use(plugin: IFSInjector);

    GetFuseHandler();

}

interface IHook_Inside {
    autouse(obj: any);
}

interface IFSInjector {
    apply(hook: IHooker);
}