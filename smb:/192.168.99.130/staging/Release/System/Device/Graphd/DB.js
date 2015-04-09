var Node = require("Node");
var db_builder = require("./Builder");
var HOTSWAP_NAME = "deltaV";
var levelQuery = require('level-queryengine'), jsonqueryEngine = require('jsonquery-engine'), levelup = require('levelup');
var DB;
function init(cb) {
    var rawDb = levelup(CONF.GRAPHD_LOCATION, { valueEncoding: "json" });
    var db = levelQuery(rawDb);
    db.query.use(jsonqueryEngine());
    db.ensureIndex("owner");
    db.ensureIndex("tag");
    db.ensureIndex("type");
    db.open(function (err, d) {
        if (err) {
            error(err);
            return cb(err);
        }
        cb(undefined, db);
    });
}
function db_hot_swap(cb) {
    var check = function (cb) {
        trace(" [1] CHCK");
        Node.fs.exists(CONF.GRAPHD_LOCATION + "_swap", function (result) {
            cb(!result ? new Error("Swap does not exist :(") : undefined);
        });
    };
    var disconnect = function (cb) {
        trace(" [2] DROP");
        var rdb = DB;
        if (rdb && rdb.isOpen()) {
            rdb.close(cb);
        }
        else {
            cb();
        }
    };
    var destroy = function (cb) {
        trace(" [3] REMV");
        exec("rm", "-rf", CONF.GRAPHD_LOCATION, cb);
    };
    var swap = function (cb) {
        trace(" [4] SWAP");
        exec("mv", CONF.GRAPHD_LOCATION + "_swap", CONF.GRAPHD_LOCATION, cb);
    };
    var link = function (cb) {
        trace(" [5] INIT");
        init(function (err, db) {
            if (err)
                return cb(err);
            DB = db;
            cb();
        });
    };
    hotswap(HOTSWAP_NAME, function (done) {
        async.series([check, disconnect, destroy, swap, link], function (err) {
            done();
            cb();
        });
    });
}
function RebuildDeltaV(cb) {
    warn("DeltaV Database - Rebuilding");
    db_builder.Rebuild(function (err, result) {
        if (err)
            return cb(err);
        db_hot_swap(cb);
    });
}
exports.RebuildDeltaV = RebuildDeltaV;
function Initialize(cb) {
    trace("Initializing DeltaV");
    init(function (err, result) {
        if (!err) {
            DB = result;
        }
        cb(err, result);
    });
}
exports.Initialize = Initialize;
function Find(query, callback) {
    hotswapSafe(HOTSWAP_NAME, callback, function (done) {
        if (!DB)
            return done(new Error("DB is not Initialized :("));
        var results = [];
        DB.query(query).on("error", function (e) {
            done(e);
        }).on("data", function (d) {
            results.push(d);
        }).on("end", function () {
            done(undefined, results);
        });
    });
}
exports.Find = Find;
function QueryStream(query, callback) {
    hotswapSafe(HOTSWAP_NAME, function () {
    }, function (done) {
        if (!DB) {
            var err = new Error("DB is not Initialized :(");
            callback(err);
            return done(err);
        }
        var stream = DB.query(query);
        stream.on("error", function (e) {
            done(e);
        }).on("end", function () {
            done();
        });
        callback(undefined, stream);
    });
}
exports.QueryStream = QueryStream;
function Owner(id_or_obj, filter, callback) {
    var id = id_or_obj.owner ? id_or_obj.owner : id_or_obj;
    filter = filter ? filter : {};
    if (!id) {
        return callback(undefined, undefined);
    }
    Find({ $and: [{ id: id }, filter] }, function (err, result) {
        callback(err, (result && result.length) ? result[0] : undefined);
    });
}
exports.Owner = Owner;
function Children(id_or_obj, filter, callback) {
    var id = id_or_obj.id ? id_or_obj.id : id_or_obj;
    filter = filter ? filter : {};
    if (!id) {
        return callback(undefined, undefined);
    }
    Find({ $and: [{ owner: id }, filter] }, function (err, result) {
        callback(err, result);
    });
}
exports.Children = Children;
function _owner_chain(id, filter, accu, depth, callback) {
    if (depth == 0) {
        return callback(undefined, accu);
    }
    Owner(id, filter, function (err, result) {
        if (err || !result)
            return callback(err, accu);
        accu.push(result);
        _owner_chain(result.id, filter, accu, depth - 1, callback);
    });
}
function _children_chain(id, filter, accu, depth, callback) {
    if (depth == 0) {
        return callback(undefined, accu);
    }
    Children(id, filter, function (err, result) {
        if (err || !result)
            return callback(err, accu);
        var job = [];
        for (var i = 0; i < result.length; i++) {
            accu.push(result[i]);
            job.push(_children_chain.bind(null, result[i].id, filter, accu, depth - 1));
        }
        if (job.length === 0)
            return callback(err, accu);
        async.series(job, callback);
    });
}
function OwnerChain(id_or_obj, filter, max_depth, callback) {
    var id = id_or_obj.id ? id_or_obj.id : id_or_obj;
    _owner_chain(id, filter, [], max_depth, callback);
}
exports.OwnerChain = OwnerChain;
function ChildrenChain(id_or_obj, filter, max_depth, callback) {
    var id = id_or_obj.id ? id_or_obj.id : id_or_obj;
    _children_chain(id, filter, [], max_depth, callback);
}
exports.ChildrenChain = ChildrenChain;
function Get(id, callback) {
    hotswapSafe(HOTSWAP_NAME, callback, function (done) {
        if (!DB)
            return done(new Error("DB is not Initialized :("));
        DB.get(id, done);
    });
}
exports.Get = Get;
function Search_By_Name(name, callback) {
    Find({ id: name }, callback);
}
exports.Search_By_Name = Search_By_Name;
function Search(name_or_tag, callback) {
    Find({ $or: [{ tag: name_or_tag }, { id: name_or_tag }] }, callback);
}
exports.Search = Search;
function Search_By_Tag(tag, callback) {
    Find({ tag: tag }, callback);
}
exports.Search_By_Tag = Search_By_Tag;
