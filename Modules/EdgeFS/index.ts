
import MirrorFS = require("./Impl/MirrorFS");
import SizeLimit = require("./Plugs/SizeLimit");
import Encrypt = require("./Plugs/Encrypt");
import umountHelper = require("./_Helper/umount");
var f4js:any = require('fuse4js');

export module FS {
    export import Mirror = MirrorFS.Mirror;
}

export module Plugs {
    export import Limit = SizeLimit.SizeLimit;
    export import WheelsEncryptor = Encrypt.RotatingWheels;
}

export import FileSystem = require("./Middleware/Hooker");

export function RawStart(mountPoint, hook: FileSystem) {
    var handler = hook.GetFuseHandler();
    f4js.start(mountPoint, handler, true);
}

export function RawUmount(mountPoint, cb) {
    umountHelper.umount(mountPoint, cb);
}

export function Init(umountKillerGuard_Path) {
    umountHelper.SetKillGuardPath(umountKillerGuard_Path);
}