import fs = require("fs");
import path = require("path");
function _mkstructure(base, tree, ignoreErr, cb) {
    //so sweet..
    //tree should be an obj
    var jobs = [];
    for (var i in tree) {
        if (!tree.hasOwnProperty(i)) continue;
        if (typeof tree[i] === "string") {
            ((i) => {
                jobs.push((cb) => {
                    var cur = path.join(base, i);
                    fs.exists(cur,(e) => {
                        if (e) return cb();
                        else {
                            fs.mkdir(cur,(err) => {
                                return cb(ignoreErr ? (void 0) : err);
                            });
                        }
                    });
                });
            })(i);
        } else if (typeof tree[i] === "object") {
            jobs.push(_mkstructure.bind(null, path.join(base, i), tree[i], ignoreErr));
        }
    }
    if (jobs.length === 0) return cb();
    async.series(jobs, cb);
}

global.mkStruct = _mkstructure;