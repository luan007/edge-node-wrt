var Node = require("Node");
function Rebuild(cb) {
    warn("Rebuilding deltaV database");
    if (!Node.fs.existsSync(Node.path.join(CONF.GRAPHD_UPGRADE_LOCATION, "graphd.0.json"))) {
        return cb(new Error("graphd datafile not found"));
    }
    warn("Add RSA Check @ GraphD Builder");
    var json;
    try {
        json = require(Node.path.join(CONF.GRAPHD_UPGRADE_LOCATION, "graphd.0.json"));
    }
    catch (e) {
        return cb(e);
    }
    var levelQuery = require('level-queryengine'), jsonqueryEngine = require('jsonquery-engine'), levelup = require('level');
    levelup.destroy(CONF.GRAPHD_LOCATION + "_swap", function (err, result) {
        if (err)
            return cb(err);
        info("Old DB destroyed");
        var db = levelQuery(levelup(CONF.GRAPHD_LOCATION + "_swap", { valueEncoding: "json" }));
        db.query.use(jsonqueryEngine());
        db.ensureIndex("name");
        db.ensureIndex("owner");
        db.ensureIndex("tag");
        db.ensureIndex("type");
        var rdb = db;
        var ws = db.createWriteStream();
        ws.on("close", function () {
            info("Done writing");
            cb();
        });
        ws.on("error", function (err, result) {
            return cb(err, undefined);
        });
        function levelmark(obj) {
            if (!obj)
                return 0;
            if (obj.level + 1 > obj.level)
                return obj.level;
            if (!obj.owner) {
                return obj.level = 0;
            }
            for (var type in json) {
                if (json[type][obj.owner]) {
                    return obj.level = levelmark(json[type][obj.owner]) + 1;
                }
            }
            return 0;
        }
        var counter = 0;
        for (var type in json) {
            for (var id in json[type]) {
                counter += 1;
                (function (type, id) {
                    process.nextTick(function () {
                        json[type][id].type = Number(type);
                        json[type][id].id = id;
                        levelmark(json[type][id]);
                        ws.write({
                            key: id,
                            value: json[type][id]
                        });
                        counter -= 1;
                        if (counter == 0) {
                            info("Flushing into _swap...");
                            ws.end();
                        }
                    });
                })(type, id);
            }
        }
    });
}
exports.Rebuild = Rebuild;
