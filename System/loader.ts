import path = require("path");
import fs = require("fs");



var SYS_ROOT;
var LOADER_NAME = "_Module";

interface IModule {
    Load(load_arg: string[], callback: Function);
}

function _load_module(index: number, modules: string[], callback: Function) {

    if (index >= modules.length && callback) {
        return callback();
    }
    console.log("[SYS_LOADER -> LOAD]   " + modules[index]);
    var current_module = modules[index];
    var args = []; //Reserved
    var module_path = path.join(SYS_ROOT, current_module, LOADER_NAME + ".js");
    if (!fs.existsSync(module_path)) {
        return callback(new Error("Module Does not Exist [" + current_module + "]"));
    }
    try {
        var _m: IModule = require(module_path);
        _m.Load(args, (e) => {
            if (e) {
                console.log("[SYS_LOADER -> *Error]   " + e.message);
                throw e;
            }
            _load_module(index + 1, modules, callback);
        });
    }
    catch (e)
    {
        console.log("[SYS_LOADER -> *Error]   " + e.message);
        console.log(e);
        return callback(e);
    }

}

export function Load(modules: string[], callback: Function) {
    SYS_ROOT = process.cwd();
    process.nextTick(() => {
        _load_module(0, modules, callback);
    });
    //DO NOT BLOCK
}

