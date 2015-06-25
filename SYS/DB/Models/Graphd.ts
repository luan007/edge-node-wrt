import orm = require("orm");
import store = require("../Storage");

export interface IGraphd extends Graphd, orm.Instance {}

export var Table:orm.Typed.TypedModel<IGraphd> = undefined; //YOU HAVE TO SET THIS MAN

export class Graphd {
    name:string = "graphd";    // always be 'graphd'
    numericDate:string = '197001010920';     //numberic date for comparison

    static table():orm.Typed.TypedModel<IGraphd> {
        if (!Table) {
            Table = <any>store.DefineTable("Graphd", Graphd, {id: ["name"]});
        }
        return Table;
    }

}