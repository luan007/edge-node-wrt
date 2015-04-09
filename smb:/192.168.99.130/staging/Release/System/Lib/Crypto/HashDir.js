var Node = require("Node");
function _hash_subdir(dir) {
    var res = "";
    if (!Node.fs.existsSync(dir)) {
        return "";
    }
    else if (Node.fs.statSync(dir).isDirectory()) {
        var d = Node.fs.readdirSync(dir).sort();
        for (var i = 0; i < d.length; i++) {
            var target = Node.path.join(dir, d[i]);
            res += d[i] + "~" + _hash_subdir(target);
        }
    }
    else {
        var hash = Node.crypto.createHash('sha512');
        hash.update(Node.fs.readFileSync(dir));
        return hash.digest("hex");
    }
    var hash = Node.crypto.createHash('sha512');
    hash.update(res);
    return hash.digest("hex");
}
global.HashDir = function (dir, salt) {
    var res = _hash_subdir(dir);
    return Node.crypto.pbkdf2Sync(res, salt, 1000, 256);
};
