var level = require("levelup");
var sub = require("level-subkey");
var codec = require("level-subkey/lib/codec");
var Node = require("Node");
var join = Node.path.join;
var _ROOT = "/ROOT/";
var db;
var root;
exports.RootKeys = {
    App: "APP",
    Edge: "EDG",
    Network: "NET",
    Device: "DEV",
    FileSystem: "EFS",
    User: "USR"
};
function Initialize(_db, cb) {
    trace("Init Registry");
    db = sub(level(_db, { valueEncoding: "json" }));
    root = db.subkey(_ROOT);
    cb();
}
exports.Initialize = Initialize;
function Escape(str) {
    return codec.escapeString(str);
}
exports.Escape = Escape;
function Unescape(str) {
    return codec.unescapeString(str);
}
exports.Unescape = Unescape;
function DestroySub(sub, cb) {
    var fin = function (err, result) {
        if (!err) {
            root.del(sub.path(), cb);
        }
        else {
            cb(err);
        }
    };
    fin = once(fin);
    var real = join("/", sub.path());
    var k = Object.keys(exports.RootKeys);
    for (var i = 0; i < k.length; i++) {
        if (real == exports.RootKeys[k[i]]) {
            return fin(new Error("Attempt deleting root_level_registries"), undefined);
        }
    }
    sub.createPathStream({ path: "." }).on("data", function (pth) {
        sub.del(join(pth.path, pth.key));
    }).on("error", fin).on("end", fin);
}
exports.DestroySub = DestroySub;
function Sector() {
    var layers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        layers[_i - 0] = arguments[_i];
    }
    layers.unshift(_ROOT);
    trace(layers);
    var key = join.apply(undefined, layers);
    return root.subkey(key);
}
exports.Sector = Sector;
