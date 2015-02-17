/*WARNING, NEW PROCESS STARTS HERE*/

//Boot Sequence Illustration (v2): 
//
// [0] ENV Extraction
//  |
//  +----------+---- target_cwd: path of the executable (parent)
//             |---- rt_id: runtime id of the application
//             |---- ui_sock: socket for main ui
//             |---- api_sock: socket for rpc
//             |---- api_json: skeleton for API reconstruction
//             |---- app_sig: signiture of this app (generated from cloud server)
//             |---- app_struct: optional, reserved
//             |---- app_struct: optional, reserved
//             +---- opts
//
// [1] Sec Check
//  |
//  +----------+---- fs existence
//             +---- fs integrity (POSSIBLE RSA) (See Purposed RSA Sign Alg)
//  
// [2] Preparation
//  |
//  +----------+---- swap cwd
//             +---- generate sandbox_vm
//             |        +---- override require
//             |        +---- override all IO operation
//             |        +---- add API object (for RPC)
//             |        +---- add sockets (for local use)
//             +---- setup hooks
//             |        +---- RPC death hook
//             |        +---- overall event hook
//             |        +---- heartbeat hook
//             |        +---- unhandled error hook
//             |        +---- driver reverse hook
//             +--------+---- reserved
//
// [3] * Launch
//  |
//  +----------+---- report alive
//  |          +---- try {..
//  |                   +---- [LAUNCH VM]
//  |          +---- catch {..
//  |                   +---- report error
//  |                   +---- self termination
//  +----------+---- state swap (launched)

// * RSA Sign Alg * (v0)
// Pseudo Code:
//     total = []
//     total += manfestfile_content
//     for each level in folder                        //
//          for each file in level                     //
//              m = hash(file)                         // file content shall not change
//              total += m + fullname_relative_to_cwd  // level structure shall not change
//                                                     // IO Opt is simply not allowed. 
//     return publickey.verify(total, app_sig)

process.on("uncaughtException", (err) => {
    console.log(err);
    //process.send({ message: err.message });
    //TODO: log
    process.exit();
});

declare var sandbox: local.Sandbox.SandboxEnvironment; //global sandbox

import rpc = require("../../../Modules/RPC/index");
import reverseAPI = require("./ReverseAPI");
import context = require("./Context");
import net = require("net");
import fs = require("fs");
import http = require("http");

var contextify = require("contextify");
var chroot = require("chroot");
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
    'unshare': ['int', ['int']] //function unshare (int) -> int
});

//http://stackoverflow.com/questions/5541288/detect-when-parent-process-exits
syscall.prctl(1, 15);

process.on('SIGTERM', function () {
    process.exit(1);
});

function Jail() {
    var result = syscall.unshare(
        CLONE_NEWIPC |
        CLONE_FS |
        CLONE_FILES |
        CLONE_NEWNET |
        //CLONE_NEWPID | //TODO: Fix this by calling clone(_PID) instead of doing node-fork
        CLONE_NEWNS | 0); //BYEBYE
    if (result < 0) {
        process.exit();
    }
}

/*Load ENV object*/
var _env: local.App.Init_Env = process.env;
var _rpc: rpc.RPCEndpoint;
var API: any;
var _api_full: any;
global.sandbox = undefined;
global.EDGE = true; //TODO: should be version
/*
    Directory Check Code - Do it in Sync Mode, should be in ASYNC mode in future releases
*/
/*Implement this as a lib (future)*/

function _early_rpc(cb) {
    _rpc = new rpc.RPCEndpoint(net.connect(_env.api_socket_path, (err, result) => {
        if (err) {
            process.exit(1);
        }
        else {
            _api_full = rpc.APIManager.GetAPI(_env.api_obj, _rpc);
            global.API = API = _api_full.API;
            //_rpc.once("ready", cb);
            cb();
        }
    }));
}

function _jail(cb) {
    require("../../../Modules/Shared/use");
    Jail(); //NO MORE NETWORK
    var mainServer = http.createServer();
    global.Server = mainServer;
    mainServer.listen(_env.main_socket,() => {
        chroot(_env.target_dir, _env.runtime_id); // YOU ARE NOBODY FROM NOW - NO MORE NOTHING
        process.chdir("/");
        process.env = {};
        process.argv = [];
        process.title = "";
        _env = undefined;
        chroot = syscall = ffi = undefined; //for .. sake
        cb();
    });
}

function _post_reverse_api(cb) {
    global.Drivers = {};
    try {
        require("/driver");
    } catch (e) {
    }
    var json = reverseAPI.GenerateReverseAPI(_rpc);
    API.Sandbox.SetupReverseAPI(json, cb);
}

function _actual_launch(cb) {
    //process.chdir("/");
    //var sandbox = context.BuildRunEnvironment(API);
    //contextify(sandbox);
    try {
        //sandbox.run("'use strict';\n require('/app');");
        //sandbox.run("require('/app')");
        require("/app");
    } catch (e) {
        console.log("Code Init Error - " + e);
        process.exit();
    }
}

function _launch() {

    //swap cwd
    async.series([
        _early_rpc,
        _jail,
        _post_reverse_api,
        _actual_launch
    ], (err, result) => {
        if (!err) {
        }
        else {
            throw err;
        }
    });
}




_launch();