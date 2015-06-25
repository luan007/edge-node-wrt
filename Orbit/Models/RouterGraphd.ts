import orm = require("orm");
import store = require("../Storage");

export interface IRouterGraphd extends RouterGraphd, orm.Instance { }
export var Table: orm.Typed.TypedModel<IRouterGraphd> = undefined; //YOU HAVE TO SET THIS MAN

export class RouterGraphd {
    router_uid: string = "";
    numericDate: string = "";
    password:string = "";
    orderTime: Date = new Date();

    static meta() {
        return {
            numericDate: { type:'text', size: 8},
            password: {type: 'text', size: 512 }
        };
    }

    static table(): orm.Typed.TypedModel<IRouterGraphd> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("RouterGraphd", RouterGraphd, { id: ["router_uid"] });
        }
        return Table;
    }

}