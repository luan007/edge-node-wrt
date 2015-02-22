//this is going to be hot-swapped during runtime-updates

//TODO: need TESTS!
import Node = require("Node");
import Core = require("Core");

import db_builder = require("./Builder");


var HOTSWAP_NAME = "deltaV";

var levelQuery :any = require('level-queryengine'),
    jsonqueryEngine :any = require('jsonquery-engine'),
    levelup :any = require('level');


/*
 * To make this swappable, a queue is needed for every op
 */


var DB;

function init(cb: PCallback<any>) {
    var rawDb = levelup(CONF.GRAPHD_LOCATION, { valueEncoding: "json" });
    var db = levelQuery(rawDb);
    db.query.use(jsonqueryEngine());

    //db.ensureIndex("name");
    db.ensureIndex("owner");
    db.ensureIndex("tag");
    db.ensureIndex("type");

    db.open((err, d) => {
        if (err) {
            error(err);
            return cb(err);
        }
        cb(undefined, db);
    });
}


/**** !USE WITH CAUTION! ****/
function db_hot_swap(cb) {

    var check = (cb) => {
        trace(" [1] CHCK");
        Node.fs.exists(CONF.GRAPHD_LOCATION + "_swap", (result) => {
            cb(!result ? new Error("Swap does not exist :(") : undefined);
        });
    };

    var disconnect = (cb) => {
        trace(" [2] DROP");
        var rdb = <LevelUp>DB;
        if (rdb && rdb.isOpen()) {
            rdb.close(cb);
        } else {
            cb();
        }
    };

    var destroy = (cb) => {
        //rm -rf magic..
        trace(" [3] REMV");
        exec("rm", "-rf", CONF.GRAPHD_LOCATION, cb);
    };

    var swap = (cb) => {
        trace(" [4] SWAP");
        exec("mv", CONF.GRAPHD_LOCATION + "_swap", CONF.GRAPHD_LOCATION, cb);
    };

    var link = (cb) => {
        trace(" [5] INIT");
        init((err, db) => {
            if (err) return cb(err);
            DB = db;
            cb();
        });
    };

    hotswap(HOTSWAP_NAME, (done) => {
        async.series([check, disconnect, destroy, swap, link], (err) => {
            done();
            cb();
        });
    });
}


export function RebuildDeltaV(cb) {
    warn("DeltaV Database - Rebuilding");
    db_builder.Rebuild((err, result) => {
        if (err) return cb(err);
        db_hot_swap(cb);
    });
}

export function Initialize(cb) {
    trace("Initializing DeltaV");
    init((err, result) => {
        if (!err) {
            DB = result;
        }
        cb(err, result);
    });
}

export function Find(query: any, callback: PCallback<IDescriptor[]>) {
    hotswapSafe(HOTSWAP_NAME, callback, (done: PCallback<IDescriptor[]>) => {
        if (!DB) return done(new Error("DB is not Initialized :("));
        var results = [];
        DB.query(query).on("error", (e) => {
            done(e);
        }).on("data", (d) => {
            results.push(d);
        }).on("end", () => {
            done(undefined, results);
        });
    });
}


export function QueryStream(query: any, callback: PCallback<NodeJS.ReadableStream>) {
    hotswapSafe(HOTSWAP_NAME, () => { }, (done) => {
        if (!DB) {
            var err = new Error("DB is not Initialized :(");
            callback(err);
            return done(err);
        }
        var stream = DB.query(query);
        stream.on("error", (e) => {
            done(e);
        }).on("end", () => {
            done();
        });
        callback(undefined, stream);
    });
}

export function Owner(id_or_obj: any, callback: PCallback<IDescriptor>) {
    var id = id_or_obj.id ? id_or_obj.id : id_or_obj;
    Find({ owner: id }, (err, result) => {
        callback(err, (result && result.length) ? result[0] : undefined);
    });
}

function _owner_chain(id, accu: any[], depth, callback) {
    if (depth == 0) {
        return callback(undefined, accu);
    }
    Owner(id, (err, result) => {
        if (err || !result) return callback(err, accu); //done
        accu.push(result);
        _owner_chain(result.id, accu, depth - 1, callback);
    });
}

export function OwnerChain(id_or_obj: any, max_depth, callback: PCallback<IDescriptor[]>) {
    var id = id_or_obj.id ? id_or_obj.id : id_or_obj;
    _owner_chain(id, [], max_depth, callback);
}

export function Get<T extends IDescriptor>(id, callback: PCallback <T>) {
    hotswapSafe(HOTSWAP_NAME, callback, (done: PCallback<T>) => {
        if (!DB) return done(new Error("DB is not Initialized :("));
        DB.get(id, done);
    });
}

export function Search_By_Name<T extends IDescriptor>(name, callback: PCallback<T[]>) {
    Find({ id: name }, <any>callback);
}

export function Search<T extends IDescriptor>(name_or_tag, callback: PCallback<T[]>) {
    Find({ $or: [{ tag: name_or_tag }, { id: name_or_tag }] }, <any>callback);
}

export function Search_By_Tag<T extends IDescriptor>(tag, callback: PCallback<T[]>) {
    Find({ tag: tag }, <any>callback);
}
