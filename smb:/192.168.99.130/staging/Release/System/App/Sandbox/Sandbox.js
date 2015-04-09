var _p = process;
process.on("uncaughtException", function (err) {
    console.log("ERROR:" + err.message);
    console.log(err.stack);
    _p.send(err);
    _p.exit();
});
var rpc = require("../../../Modules/RPC/index");
var reverseAPI = require("./ReverseAPI");
var net = require("net");
var http = require("http");
var chroot = require("./chroot");
var ffi = require("ffi");
var async = require("async");
var CLONE_NEWNET = 0x40000000;
var CLONE_NEWPID = 0x20000000;
var CLONE_FILES = 0x00000400;
var CLONE_FS = 0x00000200;
var CLONE_NEWIPC = 0x08000000;
var CLONE_NEWNS = 0x00020000;
var CLONE_NEWUTS = 0x04000000;
var CLONE_SYSVSEM = 0x00040000;
var syscall = ffi.Library(null, {
    "prctl": ["int32", ["int32", "uint32"]],
    'unshare': ['int', ['int']]
});
syscall.prctl(1, 15);
process.on('SIGTERM', function () {
    process.exit(1);
});
function Jail() {
    var result = syscall.unshare(CLONE_FS | CLONE_FILES | 0);
    if (result < 0) {
        process.exit();
    }
}
var _env = process.env;
var _rpc;
var API;
var _api_full;
global.sandbox = undefined;
global.EDGE = true;
function _early_rpc(cb) {
    _rpc = new rpc.RPCEndpoint(net.connect(_env.api_socket_path, function (err, result) {
        if (err) {
            process.exit(1);
        }
        else {
            _api_full = rpc.APIManager.GetAPI(_env.api_obj, _rpc);
            global.API = API = _api_full.API;
            cb();
        }
    }));
}
function _jail(cb) {
    require("../../../Modules/Shared/use");
    var mainServer = http.createServer();
    global.Server = global.SERVER = mainServer;
    mainServer.listen(_env.main_socket, function () {
        try {
            Jail();
            chroot(_env.target_dir, _env.runtime_id);
            global.API_JSON = _env.api_obj;
            process.env = {};
            process.argv = [];
            process.title = "";
            _env = undefined;
            chroot = syscall = ffi = undefined;
            cb();
        }
        catch (e) {
            console.log(e);
            cb(e);
        }
    });
}
function _post_reverse_api(cb) {
    global.Drivers = {};
    try {
        require("/driver");
    }
    catch (e) {
    }
    var json = reverseAPI.GenerateReverseAPI(_rpc);
    API.Sandbox.SetupReverseAPI(json, cb);
}
function _actual_launch(cb) {
    try {
        require("/app");
    }
    catch (e) {
        console.log("Code Init Error - " + e);
        process.exit();
    }
}
function _launch() {
    async.series([
        _early_rpc,
        _jail,
        _post_reverse_api,
        _actual_launch
    ], function (err, result) {
        if (!err) {
        }
        else {
            throw err;
        }
    });
}
_launch();
