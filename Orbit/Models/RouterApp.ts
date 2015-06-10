import orm = require("orm");
import store = require("../Storage");

export interface IRouterApp extends RouterApp, orm.Instance { }
export var Table: orm.Typed.TypedModel<IRouterApp> = undefined; //YOU HAVE TO SET THIS MAN

export class RouterApp {

    router_uid: string = "";
    app_uid: string = "";
    password:string = "";
    orderTime: Date = new Date();
    installTime: Date = new Date();

    static meta() {
        return {
            password: {type: 'text', size: 512 }
        };
    }

    static table(): orm.Typed.TypedModel<IRouterApp> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("RouterApp", RouterApp, { id: ["router_uid", "app_uid"] });
        }
        return Table;
    }

}