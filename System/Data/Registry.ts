import level = require("level");
import sub = require("level-subkey");
import codec = require("level-subkey/codec");
import Node = require("Node");

var join = Node.path.join;

var _ROOT = "/ROOT/";
var db: Subkey;
var root: Subkey;

export var RootKeys = {
    App: "APP",
    Edge: "EDG",
    Network: "NET",
    Device: "DEV",
    User: "USR"
};

export function Initialize(_db, cb) {
    trace("Init Registry");
    db = sub(level(_db, { valueEncoding: "json" }));
    root = db.subkey(_ROOT);
    cb();
}

export function Escape(str) {
    return codec.escapeString(str);
}

export function Unescape(str) {
    return codec.unescapeString(str);
}

/*This is dangerous, u'd better check   :o */
/*If being exp-ed... user-data might be .. */
export function DestroySub(sub: Subkey, cb) {
    var fin = function (err, result) {
        if (!err) {
            root.del(sub.path(), cb);
        } else {
            cb(err);
        }
    };
    fin = <any>once(fin);

    var real = join("/", sub.path());
    var k = Object.keys(RootKeys);
    for (var i = 0; i < k.length; i++) {
        if (real == RootKeys[k[i]]) {
            return fin(new Error("Attempt deleting root_level_registries"),
                undefined);
        }
    }
    sub.createPathStream({ path: "." })
        .on("data",
        (pth: { path; key; }) => {
            sub.del(join(pth.path, pth.key));
        })
        .on("error", fin)
        .on("end", fin);
}

export function Sector(...layers): Subkey {
    layers.unshift(_ROOT);
    trace(layers);
    var key = join.apply(undefined, layers);
    return root.subkey(key);
}
