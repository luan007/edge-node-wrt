import orm = require("orm");
import store = require("../Storage");

export interface IPackage extends Package, orm.Instance { }
export var Table: orm.Typed.TypedModel<IPackage> = undefined; //YOU HAVE TO SET THIS MAN

export class Package {
    uid:string = "";
    version:string = "";
    versionNo:number = 0;
    state:number = 0; // 0: in progess 1: in use

    static table(): orm.Typed.TypedModel<IPackage> {
        if (!Table) {
            Table = <any>store.DefineTable("Package", Package, { id: ["uid"] });
        }
        return Table;
    }

}