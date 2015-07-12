import orm = require("orm");
import store = require("../Storage");

export interface IUser extends User, orm.Instance { }
export var Table: orm.Typed.TypedModel<IUser> = undefined; //YOU HAVE TO SET THIS MAN

export class User {

    uid: string = "";
    name: string = "";
    email: string = "";
    salt: string = "";
    data: KVSet = {};
    version: number = 0;    // unix timestamp / new Date().getTime()
    avatar:string = "";     // uuid
    hashedkey: string = "";

    static meta() {
        return {
            uid: {type: 'text', size: 255 },
            salt: {type: 'text', size: 4096 },
            hashedkey: {type: 'text', size: 4096 },
            avatar: {type: 'text', size: 256 }
        };
    }

    static table(): orm.Typed.TypedModel<IUser> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("User", User, { id: ["uid"] });
        }
        return Table;
    }

}