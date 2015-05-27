import orm = require("orm");
import store = require("../Storage");

export interface IRouterApp extends RouterApp, orm.Instance { }
export var Table: orm.Typed.TypedModel<IRouterApp> = undefined; //YOU HAVE TO SET THIS MAN

export class RouterApp {

    uid: string = "";
    router_uid: string = "";
    app_uid: string = "";
    //app_sig:string = "";
    orderTime: Date = new Date();
    installTime: Date = new Date();

    static meta() {
        return {
            uid: {type: 'text', size: 255 }
        };
    }

    static table(): orm.Typed.TypedModel<IRouterApp> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("RouterApp", RouterApp, { id: ["uid"] });
        }
        return Table;
    }

}