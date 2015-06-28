declare function exec(cmd, ...args);

declare function modprobe(mod, args, callback);

declare function modprobe_r(mod, callback);

declare function insmod(mod, args, callback);

declare function rmmod(mod, callback);

declare function killall(name, callback);

declare function parsespawn(file, args: string[]): NodeJS.EventEmitter;

declare function umount_till_err(name, callback);

declare function umount(name, callback);

declare function mount_auto(src, target, args: string[], callback);

declare function parsespawn_full(file, args: string[]): {
    process: any;
    event: NodeJS.EventEmitter
};

declare var mdns;