﻿import orm = require("orm");
import store = require("../Storage");

export interface IUser extends User, orm.Instance { }
export var Table: orm.Typed.TypedModel<IUser> = undefined; //YOU HAVE TO SET THIS MAN

export class User {

    uid: string = "";
    name: string = "";
    email: string = "";
    salt: string = "";
    data: KVSet = {};
    hashedkey: string = "";

    static table(): orm.Typed.TypedModel<IUser> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("User", User, { id: ["uid"] });
        }
        return Table;
    }

}