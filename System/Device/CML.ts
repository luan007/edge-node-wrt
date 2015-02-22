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

interface QueryBase<T> {
    and?: T;
    or?: T;
    not?: T;
}

interface MatchQuery extends QueryBase<MatchQuery>, Array<MatchQuery> {

    //type
    is?: string[];

    //attr group
    attr?: string[];
    val?: ValueQuery;
    
    //action
    can?: string[];

}

interface ValueQuery extends QueryBase<ValueQuery>, Array<ValueQuery> {
    lt? ;
    gt? ;
    lte? ;
    gte? ;
    regex? ;
    eq? ;
    neq? ;
}

//{ and : { a, b }, or : { a, b } }
export function Query(param: MatchQuery) {
    
}