import orm = require("orm");
import store = require("../Storage");

export interface IUser extends User, orm.Instance { }

export var Table: orm.Typed.TypedModel<IUser> = undefined; //YOU HAVE TO SET THIS MAN

export class User {

    uid: string = "";
    name: string = "";
    //data: KVSet = {};
    data: string = "";
    version: number = 0;    // unix timestamp / new Date().getTime()
    avatar:string = "";     // uuid
    lastSeen: Date = new Date();
    //thirdparty = {}
    thirdparty: string = "";
    
    static table(): orm.Typed.TypedModel<IUser> {
        if (!Table) {
            Table = <any>store.DefineTable("User", User, { id: ["uid"] });
        }
        return Table;
    }

}