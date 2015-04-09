var fs = require("fs");
var path = require("path");
function _mkstructure(base, tree, ignoreErr, cb) {
    var jobs = [];
    for (var i in tree) {
        if (!tree.hasOwnProperty(i))
            continue;
        (function (i) {
            jobs.push(function (cb) {
                var cur = path.join(base, i);
                fs.exists(cur, function (e) {
                    if (e)
                        return cb();
                    else {
                        fs.mkdir(cur, function (err) {
                            return cb(ignoreErr ? (void 0) : err);
                        });
                    }
                });
            });
        })(i);
        if (typeof tree[i] === "object") {
            jobs.push(_mkstructure.bind(null, path.join(base, i), tree[i], ignoreErr));
        }
    }
    if (jobs.length === 0)
        return cb();
    async.series(jobs, cb);
}
global.mkStruct = _mkstructure;
