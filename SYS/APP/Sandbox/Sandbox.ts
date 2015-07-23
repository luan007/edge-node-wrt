﻿/*WARNING, NEW PROCESS STARTS HERE*/

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
//     total += manifestfile_content
//     for each level in folder                        //
//          for each file in level                     //
//              m = hash(file)                         // file content shall not change
//              total += m + fullname_relative_to_cwd  // level structure shall not change
//                                                     // IO Opt is simply not allowed. 
//     return publickey.verify(total, app_sig)

var _p = process;
process.on("uncaughtException",(err) => {
    console.log("ERROR:" + err.message);
    console.log(err.stack);
    //_p.send(err);
    _p.exit();
});

declare var sandbox: local.sandbox.SandboxEnvironment; //global sandbox

import rpc = require("../../../Modules/RPC/index");
import reverseAPI = require("./ReverseAPI");
import net = require("net");
import http = require("http");
import path = require('path');

var exec = require("child_process").execFile;
//var contextify = require("contextify");
var chroot:any = require("./chroot");
var ffi:any = require("ffi");
var async:any = require("async");

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
    //console.log('aaaaaaaaaaaaaa PID=', process.pid);

    //TODO: FIX SECURITY FLAW!!!!!!!
    var result = syscall.unshare(
        //CLONE_NEWIPC |
        CLONE_FS |


        CLONE_FILES |
        CLONE_NEWNET |

        //CLONE_NEWPID | //TODO: Fix this by calling clone(_PID) instead of doing node-fork
        /*CLONE_NEWNS*/ /*| */ 0); //BYEBYE
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
            cb();
        }
    }));
}

function _jail(cb) {
    require("../../../Modules/Shared/use");
    global.SharedLibs = {};
    try{
       var pkgjson = require(path.join(_env.target_dir, 'package.json'));
       console.log(pkgjson);
       var deps = pkgjson.dependencies;
       for(var i in deps){
           if(i.indexOf('/') >= 0) continue;
           if(deps[i] === "*"){
               try{
                   global.SharedLibs[i] = require(i);
                   console.log('Loaded Shared Lib:' + i);
               } catch(e){ 
                   console.log('Failed loading Shared Lib:' + i, e);
               }
           }
       }
       
    } catch(e) {
        console.log('Invalid Package.json');
    }
    var d = require('dns');
    var _d = require('native-dns');
    for(var k in d){
        if(_d[k]) d[k] = _d[k];
    }
    var mainServer = http.createServer();
    global.Server = global.SERVER = mainServer;
    mainServer.listen(_env.main_socket,() => {
        try {

            if (syscall.unshare(
                    CLONE_NEWNET |
                        //CLONE_NEWPID | //TODO: Fix this by calling clone(_PID) instead of doing node-fork
                        /*CLONE_NEWNS*/ /*| */ 0) < 0) //BYEBYE
                process.exit();

            exec(path.join(__dirname, 'net.sh'), [process.pid, _env.virtual_ip], (err, result) => {
                if (syscall.unshare(
                        CLONE_FILES |
                            //CLONE_NEWPID | //TODO: Fix this by calling clone(_PID) instead of doing node-fork
                            /*CLONE_NEWNS*/ /*| */ 0) < 0) //BYEBYE
                    process.exit();

                chroot(_env.target_dir, _env.runtime_id); // YOU ARE NOBODY FROM NOW - NO MORE NOTHING
                console.log('############## TARGET DIR IS SET');
                process.chdir("/");
                
                
                global.API_JSON = _env.api_obj;
                global.runtime_id = _env.runtime_id;
                process.env = {};
                process.argv = [];
                process.title = "";
                _env = undefined;
                chroot = syscall = ffi = undefined; //for .. sake
                cb();
            });
        } catch (e) {
            console.log(e);
            cb(e);
        }
    });
}

function _post_reverse_api(cb) {
    global.Drivers = {};
    try {
        require("/driver");
        if(global.Drivers) {
            for(var drvId in global.Drivers) {
                console.log(drvId);
                ((_drvId) => {
                    var driver = global.Drivers[_drvId];
                    driver.Change = (deviceId, assump) => {
                        return API.Device.Change(_drvId, deviceId, assump);
                    };
                })(drvId);
            }
        }
    } catch (e) {
        console.log('!require driver ========= failed!', e);
        console.log(e);
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