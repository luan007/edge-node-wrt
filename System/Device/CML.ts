import Node = require("Node");
import Core = require("Core");
import DriverManager = require("./DriverManager");
import DeviceManager = require("./DeviceManager");
import Graphd = require("./Graphd/DB");

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

interface LogicalQuery {
    and?: any[]; or?: any[]; not?: any;
}

interface Val {
    key: string[] | string;
    val?: ValueQuery;
}

interface MatchQuery extends LogicalQuery {
    _expanded?: any;

    and?: MatchQuery[];
    or?:  MatchQuery[];
    not?: MatchQuery;
    //type
    is?: string[] | string;
    bus?: string[] | string;

    busdata?: Val[] | Val;

    //attr group
    attr?: Val[] | Val;
    //action
    can?: string[] | string;
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

//States
var state_norm = 0;
var state_and = 1;
var state_or = 2;
var state_not = 3;

///*single step*/
//function query_atom(query, not, cb) {
//    //return true as err if nothing found (to stop async.series)
//}

//function async_boolean_step(preResult, jobs, and_1_or_0, index, cb) {
    
//    if (index == jobs.length) {
//        return cb(undefined, preResult);
//    }
//    if (and_1_or_0 && preResult && Object.keys(preResult).length == 0) {
//        return cb();
//    }
//    var curJob = jobs[index];
//    curJob((err, result) => {
        
//        //intersect between result & preResult
//        if (preResult == undefined) {
//            return async_boolean_step(result, jobs, and_1_or_0, index + 1, cb); //carry on
//        }
//        var nextResult;
//        var op = Object.keys(preResult).length > Object.keys(result).length ? result : preResult;
//        var comp = op === result ? preResult : result;
//        var keys = Object.keys(op);
//        if (and_1_or_0) {
//            nextResult = {};
//            for (var t = 0; t < keys.length; t++) {
//                //find intersection
//                if (has(op, keys[t]) && has(comp, keys[t])) {
//                    nextResult[keys[t]] = result[keys[t]];
//                }
//            }
//        } else {
//            nextResult = comp;
//            for (var t = 0; t < keys.length; t++) {
//                //find intersection
//                comp[keys[t]] = op[keys[t]];
//            }
//        }
//        return async_boolean_step(nextResult, jobs, and_1_or_0, index + 1, cb); //carry on
//    });

//}

///*logical-glue*/
//function logical_atom(query, cb) {
    
//    if (!query) { return cb(); }

//    if (Array.isArray(query.and)) {
//        var job = [];
//        for (var i = 0; i < query.and.length; i++) {
//            job.push(logical_atom.bind(null, query.and[i]));
//        }
//        return async_boolean_step(undefined, job, true, 0, cb);
//    } else if (Array.isArray(query.or)) {
//        var job = [];
//        for (var i = 0; i < query.and.length; i++) {
//            job.push(logical_atom.bind(null, query.and[i]));
//        }
//        return async_boolean_step(undefined, job, false, 0, cb);
//    } else if (query.not) {
//        //exclude these results
//        //{ not : { and : {...} } } <--stupid results
//        logical_atom(query.not,(err, result) => {
//            //invert and pop?

//        });
//    }
//    //} else if (query.or) {
//    //    logical_atom(state_or, query.or, cb);
//    //} else if (query.not) {
//    //    logical_atom(state_not, query.not, cb);
//    //} else {
//    //    logical_atom(state_norm, query, cb);
//    //}

//}


function expandQuery(query: MatchQuery, cb) {
    //var e: any = {};
    //if (!!query.is) {
    //    Graphd.Find({
    //        $and: [{ type: 0 }, {
    //            $or: [
    //                { name: !Array.isArray(query.is) ? query.is : { $all: query.is } },
    //                { tag: !Array.isArray(query.is) ? query.is : { $all: query.is } }
    //            ]
    //        }]
    //    },(err, des) => {
    //            if (!err && des && des.length) {
    //                e.is = des;
    //            }
    //        });
    //}
    //if (!!query.can) {
    //    Graphd.Find({
    //        $and: [{ type: 2 }, {
    //            $or: [
    //                { name: !Array.isArray(query.can) ? query.can : { $all: query.can } },
    //                { tag: !Array.isArray(query.can) ? query.can : { $all: query.can } }
    //            ]
    //        }]
    //    },(err, des) => {
    //            if (!err && des && des.length) {
    //                e.can = des;
    //            }
    //        });
    //}
}

//takes care of one element + one condition
//query should be normalized (this method gets HOT)
function qualifier(element: IDevice, query: MatchQuery, cb) {
    if (!query._expanded) {
        //query._expanded = expandQuery(query);
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

export function Query(param: MatchQuery) {
    
}


//Expected:
Query({
    and: [
        { can: ["print", "scan"] }, {
            or: [
                { is: "printer" }, { is: "tv" }
            ]
        }
    ]
});