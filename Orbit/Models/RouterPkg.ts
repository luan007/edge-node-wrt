import orm = require("orm");
import store = require("../Storage");

export interface IRouterPkg extends RouterPkg, orm.Instance { }
export var Table: orm.Typed.TypedModel<IRouterPkg> = undefined; //YOU HAVE TO SET THIS MAN

export class RouterPkg {
    router_uid: string = "";
    pkg_version: string = "";
    password:string = "";
    orderTime: Date = new Date();
    installTime: Date = new Date();

    static meta() {
        return {
            uid: {type: 'text', size: 255 },
            password: {type: 'text', size: 255 }
        };
    }

    static table(): orm.Typed.TypedModel<IRouterPkg> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("RouterPkg", RouterPkg, { id: ["router_uid", "pkg_version"] });
        }
        return Table;
    }

}