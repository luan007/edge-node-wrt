var _env: local.App.Init_Env = process.env;
import path = require("path");

function _require(...args) {
    console.log("require-called " + args.toString());
    return require.apply(this, args);
}

function _setTimeout(...args) {
    return setTimeout.apply(this, args);
}

function _setInterval(...args) {
    return setInterval.apply(this, args);
}

function _clearTimeout(...args) {
    return clearTimeout.apply(this, args);
}

function _clearInterval(...args) {
    return clearInterval.apply(this, args);
}

function _error(err) {
    this.message = err;
}

var SandboxedModule = require('./sandboxed_module_fork');

export function BuildRunEnvironment(API): any {

    var sandbox: any = {};
    sandbox.API = API;
    //SandboxedModule.prototype._getLocals = function () {
    //    var locals: any = {
    //        __filename: this.filename,
    //        __dirname: path.dirname(this.filename),
    //        module: this.module,
    //        exports: this.exports
    //    };
    //    //must be initialized after exports, or cyclic dependencies won't work
    //    locals.require = function (arg) {
    //        return SandboxedModule.require_fromDir(arg, path.dirname(this.filename), {});
    //    };
    //    return locals;
    //};

    SandboxedModule.prototype._getGlobals = function () {
        var g = sandbox.getGlobal();
        var t = g.global;
        return t;
    };
    module["paths"] = [];
    module["paths"].push("node_modules");
    module["paths"].push("/");
    //sandbox.require = _require
    //sandbox.console = console;
    sandbox.process = process;
    sandbox.console = console;
    sandbox.require = (arg) => {
        return SandboxedModule.require(arg);
    };
    sandbox.global = {};
    sandbox.global.API = API;
    //sandbox.global = {};
    Object.keys(sandbox).forEach((val, i, arr) => {
        sandbox.global[val] = sandbox[val];
    });
    return sandbox;
}
