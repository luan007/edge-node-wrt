//this is going to be hot-swapped during runtime-updates

//TODO: need TESTS!
import db_builder = require("./Builder");
import fs = require('fs');
var unzip = require("unzip");
import _Graphd = require('../../DB/Models/Graphd');
import Graphd = _Graphd.Graphd;
import IGraphd = _Graphd.IGraphd;
import StatMgr = require('../../Common/Stat/StatMgr');
import _StatNode = require('../../Common/Stat/StatNode');
import StatNode = _StatNode.StatNode;

var lastError:any = null;
var HOTSWAP_NAME = "deltaV";

var levelQuery:any = require('level-queryengine'),
    jsonqueryEngine:any = require('jsonquery-engine'),
    levelup:any = require('levelup');


/*
 * To make this swappable, a queue is needed for every op
 */

var pub = StatMgr.Pub(SECTION.DB, {
    graphd: {}
});


var DB;

function init(cb:PCallback<any>) {
    console.log('===> CONF.GRAPHD_DIR'['greenBG'].bold, CONF.GRAPHD_LOCATION);
    var rawDb = levelup(CONF.GRAPHD_LOCATION, {valueEncoding: "json"});
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
        pub.Set('graphd', {
            State: 'running'
        });
        cb(undefined, db);
    });
}


/**** !USE WITH CAUTION! ****/
function db_hot_swap(cb) {

    var check = (cb) => {
        trace(" [1] CHCK");
        fs.exists(CONF.GRAPHD_LOCATION + "_swap", (result) => {
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

function InsertOrUpdate(numericDate:string, callback:Callback) {
    Graphd.table().one({name: 'graphd'}, (err, result) => {
        var upgrade = false;
        var data = <any>{};
        if (!err && result) {
            upgrade = true;
        }
        data.name = 'graphd';
        data.numericDate = numericDate;
        if (upgrade) {
            console.log(("Upgrading " + numericDate)['greenBG'].bold);
            result.save(data, callback);
        } else {
            console.log(("Saving " + numericDate)['greenBG'].bold);
            Graphd.table().create(data, callback);
        }
    });
}

function DownloadGraphd(cb:Callback) {
    intoQueue('DownloadGraphd',
        (callback:Callback) => {
            pub.Set('graphd', {
                State: 'downloading'
            });

            Orbit.Post('Packages/graphd/purchase', {}, (err, orbitResult)=> {
                if (err) {
                    pub.Set('graphd', {
                        State: 'error',
                        Error: err
                    });
                    return callback(err);
                }

                //console.log('orbitResult'['cyanBG'].bold, orbitResult.numericDate, orbitResult.pkg_sig.toString('hex'));
                fs.writeFile(CONF.GRAPHD_PASSWORD_FILE, orbitResult.pkg_sig, {encoding: 'binary'}, (err)=> { //save password
                    if (err) {
                        pub.Set('graphd', {
                            State: 'error',
                            Error: err
                        });
                        return callback(err);
                    }

                    var graphdPackageTmpPath = path.join(CONF.PKG_TMP_DIR, 'graphd.zip.tmp');
                    if (fs.existsSync(graphdPackageTmpPath))
                        fs.unlinkSync(graphdPackageTmpPath);
                    var graphdPackagePath = path.join(CONF.PKG_TMP_DIR, 'graphd.zip');
                    if (fs.existsSync(graphdPackagePath))
                        fs.unlinkSync(graphdPackagePath);
                    var graphdStream = fs.createWriteStream(graphdPackageTmpPath);

                    Orbit.Download('Packages/graphd/download', {}, (err, result)=> {
                        if (err) {
                            pub.Set('graphd', {
                                State: 'error',
                                Error: err
                            });
                            return callback(err);
                        }
                        result.pipe(graphdStream);
                    });

                    graphdStream
                        .on('error', (err)=> {
                            pub.Set('graphd', {
                                State: 'error',
                                Error: err
                            });
                            return callback(err);
                        })
                        .on('finish', ()=> {
                            pub.Set('graphd', {
                                State: 'upgrading'
                            });

                            pub.Set('graphd', {
                                State: 'decrypting'
                            });

                            exec('openssl rsautl -decrypt -inkey ' + CONF.APP_PRV_KEY + ' -in ' + CONF.GRAPHD_PASSWORD_FILE, (err2, password) => {
                                if (err2) {
                                    pub.Set('graphd', {
                                        State: 'error',
                                        Error: err2
                                    });
                                    return callback(err);
                                }

                                exec('openssl enc -d -aes-256-cbc -pass pass:' + password + ' -in ' + graphdPackageTmpPath + ' -out ' + graphdPackagePath, (err3)=> {
                                    if (err3) {
                                        pub.Set('graphd', {
                                            State: 'error',
                                            Error: err3
                                        });
                                        return callback(err);
                                    }

                                    pub.Set('graphd', {
                                        State: 'extracting'
                                    });

                                    fs.createReadStream(graphdPackagePath)
                                        .pipe(unzip.Extract({path: CONF.GRAPHD_LOCATION}))
                                        .on('error', (err4)=> {
                                            pub.Set('graphd', {
                                                State: 'error',
                                                Error: err4
                                            });
                                            return callback(err4);
                                        })
                                        .on("close", () => {
                                            InsertOrUpdate(orbitResult.numericDate, (err4)=> {
                                                if (err4) {
                                                    pub.Set('graphd', {
                                                        State: 'error',
                                                        Error: err4
                                                    });
                                                    return callback(err4);
                                                }

                                                pub.Set('graphd', {
                                                    State: 'versioning'
                                                });

                                                return callback();
                                            });
                                        });
                                });
                            });
                        });
                });
            });
        },
        (err)=> {
            return cb(err);
        });
}

function GetGraphdVersion(callback:Callback) {
    Orbit.Get('Packages/graphd/version', {}, (err, orbitResult) => {
        if (err) return callback(err);
        return callback(undefined, orbitResult.numericDate);
    });
}

function CheckGraphdUpdate() {
    GetGraphdVersion((err, numericDate)=> {
        if (err) return error(err);

        Graphd.table().get('graphd', (err, graphd)=> {
            if (err) return error(err);

            var needDownload = false;
            if (!graphd) {
                needDownload = true;
            } else if (Number(graphd.numericDate) < Number(numericDate)) {
                needDownload = true;
            }

            if (needDownload) {
                return DownloadGraphd((err)=> {
                    if (err) return error(err);
                    else return console.log('upgrade graphd successfully.'['greenBG'].bold);
                });
            }
        });
    });
}

export function Initialize(cb) {
    setJob('GraphdChecking', CheckGraphdUpdate, CONF.GRAPHD_CHECK_INTERVAL);

    if (fs.existsSync(CONF.GRAPHD_LOCATION) && fs.readdirSync(CONF.GRAPHD_LOCATION).length > 0) {
        console.log("Initializing DeltaV"['greenBG'].bold);
        init((err, result) => {
            lastError = err;
            if (!err) {
                DB = result;
            }
            cb(err, result);
        });
    } else {
        console.log("Graphd folder is empty, then wait for downloading."['greenBG'].bold);
        UntilPingSuccess((err, res) => {
            console.log('ping Orbit success: ', res);
            DownloadGraphd((err2)=> {
                if (err2) return error(err2);

                init((err, result) => {
                    lastError = err;
                    if (!err) {
                        DB = result;
                    }
                    cb(err, result);
                });
            });
        });
        cb();
    }
}

export function Diagnose(callback:Callback) {
    if (lastError) return callback(lastError);
    return callback(null, true);
}

export function Find(query:any, callback:PCallback<IDescriptor[]>) {
    hotswapSafe(HOTSWAP_NAME, callback, (done:PCallback<IDescriptor[]>) => {
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

export function QueryStream(query:any, callback:PCallback<NodeJS.ReadableStream>) {
    hotswapSafe(HOTSWAP_NAME, () => {
    }, (done) => {
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

export function QueryType($type:number, callback:PCallback<IDic<IDescriptor>>) {
    var query = {$and: [{type: $type}]};
    hotswapSafe(HOTSWAP_NAME, callback, (done:PCallback<IDic<IDescriptor>>) => {
        if (!DB) return done(new Error("DB is not Initialized :("));
        var results:IDic<IDescriptor> = {};
        DB.query(query).on("error", (e) => {
            done(e);
        }).on("data", (d) => {
            results[d.id] = d;
        }).on("end", () => {
            done(undefined, results);
        });
    });
}

export function Owner(id_or_obj:any, filter, callback:PCallback<IDescriptor>) {
    var id = id_or_obj.owner ? id_or_obj.owner : id_or_obj;
    filter = filter ? filter : {};
    if (!id) {
        return callback(undefined, undefined);
    }
    Find({$and: [{id: id}, filter]}, (err, result) => {
        callback(err, (result && result.length) ? result[0] : undefined);
    });
}

export function Children(id_or_obj:any, filter, callback:PCallback<IDescriptor[]>) {
    var id = id_or_obj.id ? id_or_obj.id : id_or_obj;
    filter = filter ? filter : {};
    if (!id) {
        return callback(undefined, undefined);
    }
    Find({$and: [{owner: id}, filter]}, (err, result) => {
        callback(err, result);
    });
}

function _owner_chain(id, filter, accu:any[], depth, callback) {
    if (depth == 0) {
        return callback(undefined, accu);
    }
    Owner(id, filter, (err, result) => {
        if (err || !result) return callback(err, accu); //done
        accu.push(result);
        _owner_chain(result.id, filter, accu, depth - 1, callback);
    });
}

function _children_chain(id, filter, accu:any[], depth, callback) {
    if (depth == 0) {
        return callback(undefined, accu);
    }
    Children(id, filter, (err, result) => {
        if (err || !result) return callback(err, accu); //done
        var job = [];
        for (var i = 0; i < result.length; i++) {
            accu.push(result[i]);
            job.push(_children_chain.bind(null, result[i].id, filter, accu, depth - 1));
        }
        if (job.length === 0) return callback(err, accu); //done
        async.series(job, callback);
    });
}

export function OwnerChain(id_or_obj:any, filter, max_depth, callback:PCallback<IDescriptor[]>) {
    var id = id_or_obj.id ? id_or_obj.id : id_or_obj;
    _owner_chain(id, filter, [], max_depth, callback);
}

export function ChildrenChain(id_or_obj:any, filter, max_depth, callback:PCallback<IDescriptor[]>) {
    var id = id_or_obj.id ? id_or_obj.id : id_or_obj;
    _children_chain(id, filter, [], max_depth, callback);
}

export function Get<T extends IDescriptor>(id, callback:PCallback <T>) {
    hotswapSafe(HOTSWAP_NAME, callback, (done:PCallback<T>) => {
        if (!DB) return done(new Error("DB is not Initialized :("));
        DB.get(id, done);
    });
}

export function Search_By_Name<T extends IDescriptor>(name, callback:PCallback<T[]>) {
    Find({id: name}, <any>callback);
}

export function Search<T extends IDescriptor>(name_or_tag, callback:PCallback<T[]>) {
    Find({$or: [{tag: name_or_tag}, {id: name_or_tag}]}, <any>callback);
}

export function Search_By_Tag<T extends IDescriptor>(tag, callback:PCallback<T[]>) {
    Find({tag: tag}, <any>callback);
}
