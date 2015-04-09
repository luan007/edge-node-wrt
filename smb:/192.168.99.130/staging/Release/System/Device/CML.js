var DeviceManager = require("./DeviceManager");
var Graphd = require("./Graphd/DB");
var find = require('simple-object-query').find;
function _test_(self, target) {
    if (_.isRegExp(self)) {
        return self.test(target);
    }
    else {
        return self === target;
    }
}
function _explode_($query, type, fetchchildren, childdepth, cb) {
    if (Array.isArray($query)) {
        $query = {
            $or: [{ name: { $all: $query } }, { tag: { $all: $query } }]
        };
    }
    else if (_.isRegExp($query) || _.isString($query)) {
        $query = {
            $or: [{ name: $query }, { tag: $query }]
        };
    }
    $query = {
        $and: [
            { type: type },
            $query
        ]
    };
    Graphd.Find($query, function (err, des) {
        if (err || !des || des.length == 0) {
            return cb(undefined);
        }
        else if (!fetchchildren) {
            var t = [];
            for (var i = 0; i < des.length; i++) {
                t.push(des[i].id);
            }
            return cb(t);
        }
        else {
            var t = [];
            var jobs = [];
            for (var i = 0; i < des.length; i++) {
                t.push(des[i].id);
                jobs.push(Graphd.ChildrenChain.bind(null, des[i].id, {
                    type: type
                }, childdepth === undefined ? -1 : childdepth));
            }
            async.series(jobs, function (err, result) {
                if (!err) {
                    for (var i = 0; i < result.length; i++) {
                        for (var j = 0; j < result[i].length; j++) {
                            t.push(result[i][j]);
                        }
                    }
                }
                return cb(t);
            });
        }
    });
}
var parsers = {
    can: function (element, can, cb) {
        if (can.__expanded) {
            can = can.__expanded;
        }
        else if (can.$) {
            return _explode_(can.$, 2, can.expand, can.depth, function (result) {
                can.__expanded = result;
                parsers.can(element, can, cb);
            });
        }
        if (can === undefined) {
            return cb(true);
        }
        if (!Array.isArray(can)) {
            can = [can];
        }
        else if (can.length == 0) {
            return cb(false);
        }
        for (var t = 0; t < can.length; t++) {
            var found = false;
            for (var i in element.assumptions) {
                if (element.assumptions[i].actions[can[t]]) {
                    found = true;
                    continue;
                }
                for (var j in element.assumptions[i].actions) {
                    if (_test_(can[t], j)) {
                        found = true;
                        continue;
                    }
                }
            }
            if (!found) {
                return cb(true);
            }
        }
        return cb(false);
    },
    is: function (element, is, cb) {
        if (is.__expanded) {
            is = is.__expanded;
        }
        else if (is.$) {
            return _explode_(is.$, 0, is.expand, is.depth, function (result) {
                is.__expanded = result;
                parsers.can(element, is, cb);
            });
        }
        if (is === undefined) {
            return cb(true);
        }
        if (!Array.isArray(is)) {
            is = [is];
        }
        else if (is.length == 0) {
            return cb(false);
        }
        for (var t = 0; t < is.length; t++) {
            var found = false;
            for (var i in element.assumptions) {
                if (element.assumptions[i].classes[is[t]]) {
                    found = true;
                    continue;
                }
                for (var j in element.assumptions[i].classes) {
                    if (_test_(is[t], j)) {
                        found = true;
                        continue;
                    }
                }
            }
            if (!found) {
                return cb(true);
            }
        }
        return cb(false);
    },
    bus: function (element, bus, cb) {
        var result = find(element.bus, bus);
        return cb(!result || result.length == 0);
    },
    attr: function (element, attr, cb) {
        if (attr.__expanded) {
            attr = attr.__expanded;
        }
        else if (attr.$) {
            return _explode_(attr.$, 1, attr.expand, attr.depth, function (result) {
                attr.__expanded = result;
                parsers.can(element, attr, cb);
            });
        }
        if (attr === undefined) {
            return cb(true);
        }
        if (!Array.isArray(attr)) {
            attr = [attr];
        }
        else if (attr.length == 0) {
            return cb(false);
        }
        for (var t = 0; t < attr.length; t++) {
            var found = false;
            for (var i in element.assumptions) {
                if (element.assumptions[i].attributes[attr[t]]) {
                    found = true;
                    continue;
                }
                for (var j in element.assumptions[i].attributes) {
                    if (_test_(attr[t], j)) {
                        found = true;
                        continue;
                    }
                }
            }
            if (!found) {
                return cb(true);
            }
        }
        return cb(false);
    }
};
function qualifier(element, query, cb) {
    var jobs = [];
    for (var i in query) {
        if (parsers[i]) {
            jobs.push(parsers[i].bind(element, query[i]));
        }
    }
    if (jobs.length > 0) {
        async.series(jobs, function (not_passed) {
            process.nextTick(cb.bind(null, !!!not_passed));
        });
    }
    else {
        process.nextTick(cb.bind(null, true));
    }
}
function chain(qualifier, negate, obj, query, cb) {
    if (!query) {
        return process.nextTick(cb.bind(null, negate));
    }
    if (Array.isArray(query.and)) {
        async.detectSeries(query.and, chain.bind(null, qualifier, true, obj), function (result) {
            process.nextTick(cb.bind(null, negate ? !!result : !!!result));
        });
    }
    else if (Array.isArray(query.or)) {
        async.detectSeries(query.or, chain.bind(null, qualifier, false, obj), function (result) {
            process.nextTick(cb.bind(null, negate ? !!!result : !!result));
        });
    }
    else if (!!query.not) {
        process.nextTick(chain.bind(null, qualifier, true, obj, query.not, cb));
    }
    else {
        qualifier(obj, !!query.self ? query.self : query, function (result) {
            cb(negate ? !result : result);
        });
    }
}
function Query(query, callback) {
    var devs = DeviceManager.Devices();
    var jobs = [];
    var fin = [];
    for (var d in devs) {
        (function (d) {
            jobs.push(function (cb) {
                chain(qualifier, false, devs[d], query, function (result) {
                    if (result) {
                        fin.push(devs[d]);
                    }
                    cb();
                });
            });
        })(d);
    }
    async.series(jobs, function () {
        callback(undefined, fin);
    });
}
exports.Query = Query;
function Demo() {
    Query({
        and: [
            { can: ["print"] },
            {
                or: [
                    { is: "printer" },
                    { is: "tv" }
                ]
            }
        ]
    }, function (err, result) {
    });
    Query({
        and: [
            {
                can: {
                    $: { name: "print" }
                }
            },
            {
                not: {
                    or: [
                        { is: /regex_should_work/ },
                        {
                            is: {
                                $: {
                                    tag: "generic"
                                },
                                expand: true,
                                depth: -1
                            }
                        },
                        {
                            bus: {
                                name: /wifi/gi,
                                'data.Lease': /undefined/gi
                            }
                        }
                    ]
                }
            }
        ]
    }, function (err, result) {
    });
}
__API(Query, "Device.Query", [4 /* DeviceAccess */]);
