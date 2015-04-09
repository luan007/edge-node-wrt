var path = require("path");
var fs = require("fs");
var SYS_ROOT;
var LOADER_NAME = "_Module";
function _load_module(index, modules, callback) {
    if (index >= modules.length && callback) {
        return callback();
    }
    console.log("[SYS_LOADER -> LOAD]   " + modules[index]);
    var current_module = modules[index];
    var args = [];
    var module_path = path.join(SYS_ROOT, current_module, LOADER_NAME + ".js");
    if (!fs.existsSync(module_path)) {
        return callback(new Error("Module Does not Exist [" + current_module + "]"));
    }
    try {
        var _m = require(module_path);
        _m.Load(args, function (e) {
            if (e) {
                console.log("[SYS_LOADER -> *Error]   " + e.message);
                throw e;
            }
            _load_module(index + 1, modules, callback);
        });
    }
    catch (e) {
        console.log("[SYS_LOADER -> *Error]   " + e.message);
        console.log(e);
        return callback(e);
    }
}
function Load(modules, callback) {
    SYS_ROOT = process.cwd();
    process.nextTick(function () {
        _load_module(0, modules, callback);
    });
}
exports.Load = Load;
