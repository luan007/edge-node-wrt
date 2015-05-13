//TODO: Test CML
//CRAP ALERT
//NOT IN PRODUCTION QUALITY

import DriverManager = require("./DriverManager");
import DeviceManager = require("./DeviceManager");
import Graphd = require("./Graphd/DB");
var find = require('simple-object-query').find;

/*
 CML Stands for Co(M)mon language service layer
 provide vital glue between raw device-abstraction and 
 human-language queries
*/

/*
 One of the key-target of this project is to provide such query experiences:
 Network.find({type: ['Printer']});

 Nutshell:
 
 -> query (param)
             |
             +------- type, attr, action (verb)
                      [fuzzy] [fuzzy] [fuzzy]
 ->         resolve:  typeId[], attrId[], actionId[]  (Graphd query)
 ->         match (tree-recur)
             |
             +------- match(atom) -> Device 
*/

/*
  note, TS1.4 is required for providing correct type inference,
  Webstorm may report (MatchQuery | MatchQuery[]) an error which you can safely ignore.
*/


/*Le Code*/
interface LogicalQuery {
    and?: any[]; or?: any[]; not?: any;
}

interface MatchQuery extends LogicalQuery {
    and?: MatchQuery[];
    or?:  MatchQuery[];
    not?: MatchQuery;
    //type
    is?;
    bus?;
    //attr group
    //attr?: Val[] | Val;
    attr? ;
    //action
    can?;
}

interface ValueQuery extends LogicalQuery {
    and?: ValueQuery[];
    or?: ValueQuery[];
    not?: ValueQuery;
    lt? ;
    gt? ;
    lte? ;
    gte? ;
    regex? ;
    eq? ;
    neq? ;
}

function _test_(self, target) {
    if (_.isRegExp(self)) {
        return self.test(target);
    } else {
        return self === target;
    }
}

function _explode_($query, type, fetchchildren, childdepth, cb) {
    if (Array.isArray($query)) {
        $query = {
            $or: [{ name: { $all: $query } }, { tag: { $all: $query } }]
        };
    } else if (_.isRegExp($query) || _.isString($query)) {
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
    Graphd.Find($query,(err, des) => {
        if (err || !des || des.length == 0) {
            return cb(undefined);
        } else if (!fetchchildren) {
            var t = [];
            for (var i = 0; i < des.length; i++) {
                t.push(des[i].id);
            }
            return cb(t);
        } else {
            var t = [];
            var jobs = [];
            for (var i = 0; i < des.length; i++) {
                t.push(des[i].id);
                jobs.push(Graphd.ChildrenChain.bind(null, des[i].id, {
                    type: type
                }, childdepth === undefined ? -1 : childdepth));
            }
            async.series(jobs,(err, result) => {
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

/*Return true if ERROR, NOR/NAND logic*/
var parsers = {
    can: function (element: IDevice, can, cb) {
        if (has(can, '__expanded')) {
            can = can.__expanded;
        }
        else if (can.$) {
            return _explode_(can.$, 2, can.expand, can.depth,(result) => {
                can.__expanded = result;
                parsers.can(element, can, cb);
            });
        }
        if (can === undefined) {
            return cb(true);
        }
        //test
        if (!Array.isArray(can)) {
            can = [can];
        } else if (can.length == 0) {
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
    is: function (element: IDevice, is, cb) {
        if (has(is, '__expanded')) {
            is = is.__expanded;
        }
        else if (is.$) {
            return _explode_(is.$, 0, is.expand, is.depth,(result) => {
                is.__expanded = result;
                parsers.can(element, is, cb);
            });
        }
        if (is === undefined) {
            return cb(true);
        }
        //test
        if (!Array.isArray(is)) {
            is = [is];
        } else if (is.length == 0) {
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
    bus: function (element: IDevice, bus, cb) {
        var result = find(element.bus, bus);
        return cb(!result || result.length == 0);
    },
    attr: function (element, attr, cb) {
        //TODO: support nested value search
        if (has(attr, '__expanded')) {
            attr = attr.__expanded;
        }
        else if (attr.$) {
            return _explode_(attr.$, 1, attr.expand, attr.depth, (result) => {
                attr.__expanded = result;
                parsers.can(element, attr, cb);
            });
        }
        if (attr === undefined) {
            return cb(true);
        }
        //test
        if (!Array.isArray(attr)) {
            attr = [attr];
        } else if (attr.length == 0) {
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

//takes care of one element + one condition
//query should be normalized (this method gets HOT)
function qualifier(element, query: MatchQuery, cb) {
    var jobs = [];
    for (var i in query) {
        if (parsers[i]) {
            jobs.push(parsers[i].bind(null, element, query[i]));
        }
    }
    if (jobs.length > 0) {
        async.series(jobs,(not_passed) => {
            process.nextTick(cb.bind(null, !!!not_passed));
        });
    } else {
        process.nextTick(cb.bind(null, true));
    }
}

//takes care of one element + condition chain(step)
function chain(qualifier, negate, obj, query, cb) {
    if (!query) {
        //return false for god sake..
        return process.nextTick(cb.bind(null, negate));
    }
    if (Array.isArray(query.and)) { //stop when result=false (negate) (bad)
        async.detectSeries(query.and, chain.bind(null, qualifier, true, obj), function (result) {
            process.nextTick(cb.bind(null, negate ? !!result : !!!result)); //!!!is fun..
        });
    }
    else if (Array.isArray(query.or)) { //stop when result=true (good)
        async.detectSeries(query.or, chain.bind(null, qualifier, false, obj), function (result) {
            process.nextTick(cb.bind(null, negate ? !!!result : !!result)); //!!!is fun..
        });
    }
    else if (!!query.not) {
        process.nextTick(chain.bind(null, qualifier, true, obj, query.not, cb)); //pass through
    }
    else { //real shit
        qualifier(obj, !!query.self ? query.self : query, function (result) {
            cb(negate ? !result : result); //yea
        });
    }
}

//Le Loop
export function Query(query: MatchQuery, callback) {
    var devs = DeviceManager.Devices();
    var jobs = [];
    var fin = [];
    for (var d in devs) {
        ((d) => { //Le Closure
            jobs.push((cb) => { //Le Job
                chain(qualifier, false, devs[d], query,(result) => {
                    if (result) {
                        fin.push(devs[d]);
                    }
                    cb();
                });
            });
        })(d);
    }
    async.series(jobs,() => {
        callback(undefined, fin); //Le Callback
    });
}


function Demo() {

    //Le Demo:
    Query({
        and: [
            { can: ["print"] }, {
                or: [
                    { is: "printer" }, { is: "tv" }
                ]
            }
        ]
    },(err, result) => {
            //Le Test
        });

    //Le Demo with all sorts of crap[TM]:
    Query({
        and: [
            {
                can: {
                    $: { name: "print" } //Le embedded query for Graphd tree
                }
            }, {
                /*why*/ not: {
                    or: [
                        { is: /regex_should_work/ },
                        {
                            is: {
                                $: {
                                    tag: "generic"
                                },
                                expand: true, //full (das) auto
                                depth: -1
                            }
                        },
                        { //tripple [TM]
                            bus: {
                                name: /wifi/gi ,
                                'data.Lease': /undefined/gi //Le complex
                            }
                        }
                    ]
                }
            }
        ]
    },(err, result) => {
            //Le Magic..
        });

}


__API(Query, "Device.Query", [Permission.DeviceAccess]);