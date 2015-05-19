import fs = require('fs');
import crypto = require('crypto');
import path = require('path');

function _hash_subdir(dir) {
    var res = "";
    if (!fs.existsSync(dir)) {
        return "";
    } else if (fs.statSync(dir).isDirectory()) {
        var d = fs.readdirSync(dir).sort();
        //d = d.sort();
        for (var i = 0; i < d.length; i++) {
            //console.log(d[i]);
            var target = path.join(dir, d[i]);
            res += d[i] + "~" + _hash_subdir(target);
        }
    } else {
        var hash = crypto.createHash('sha512');
        hash.update(fs.readFileSync(dir));
        return hash.digest("hex");
    }
    var hash = crypto.createHash('sha512');
    hash.update(res);
    return hash.digest("hex");
}

global.HashDir = function(dir, salt) {
    var res = _hash_subdir(dir);
    return crypto.pbkdf2Sync(res, salt, 1000, 256);
}