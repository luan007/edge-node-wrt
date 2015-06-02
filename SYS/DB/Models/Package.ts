import orm = require("orm");
import store = require("../Storage");

export interface IPackage extends Package, orm.Instance { }
export var Table: orm.Typed.TypedModel<IPackage> = undefined; //YOU HAVE TO SET THIS MAN

export class Package {

    version:string = "";
    versionNo:number = 0;
    pubTime:Date = new Date();
    dirHashCode:string = "";

    static table(): orm.Typed.TypedModel<IPackage> {
        if (!Table) {
            Table = <any>store.DefineTable("Package", Package, { id: ["version"] });
        }
        return Table;
    }

}