var _env = process.env;
function _require() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    console.log("require-called " + args.toString());
    return require.apply(this, args);
}
function _setTimeout() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    return setTimeout.apply(this, args);
}
function _setInterval() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    return setInterval.apply(this, args);
}
function _clearTimeout() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    return clearTimeout.apply(this, args);
}
function _clearInterval() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    return clearInterval.apply(this, args);
}
function _error(err) {
    this.message = err;
}
var SandboxedModule = require('./sandboxed_module_fork');
function BuildRunEnvironment(API) {
    var sandbox = {};
    sandbox.API = API;
    SandboxedModule.prototype._getGlobals = function () {
        var g = sandbox.getGlobal();
        var t = g.global;
        return t;
    };
    module["paths"] = [];
    module["paths"].push("node_modules");
    module["paths"].push("/");
    sandbox.process = process;
    sandbox.console = console;
    sandbox.require = function (arg) {
        return SandboxedModule.require(arg);
    };
    sandbox.global = {};
    sandbox.global.API = API;
    Object.keys(sandbox).forEach(function (val, i, arr) {
        sandbox.global[val] = sandbox[val];
    });
    return sandbox;
}
exports.BuildRunEnvironment = BuildRunEnvironment;
