import orm = require("orm");
import store = require("../Storage");

export interface IRouter extends Router, orm.Instance {
}
export var Table:orm.Typed.TypedModel<IRouter> = undefined; //YOU HAVE TO SET THIS MAN

export class Router {

    uid:string = "";
    salt:string = "";
    hashedkey:string = "";
    access:string = "";
    accessTime:Date = new Date();
    state:number = 0;
    attributes:KVSet = {};
    appkey:string = "";
    routerkey:string = "";
    active:boolean = false;
    produced:boolean = false;

    static meta() {
        return {
            uid: { type:'text', size:255},
            hashedkey: {type: 'text', size: 4096 },
            salt: {type: 'text', size: 4096 },
            appkey: {type: 'text', size: 4096 },
            routerkey: {type: 'text', size: 512 }
        };
    }

    static table():orm.Typed.TypedModel<IRouter> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("Router", Router, {id: ["uid"]});
        }
        return Table;
    }

}