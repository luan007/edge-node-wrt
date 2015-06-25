import orm = require("orm");
import store = require("../Storage");

export interface IGraphd extends Graphd, orm.Instance {
}
export var Table:orm.Typed.TypedModel<IGraphd> = undefined; //YOU HAVE TO SET THIS MAN

export class Graphd {
    name:string = "graphd";    // always be 'graphd'
    numericDate:number = 19700101;     //numberic date for comparison

    static meta() {
        return {
            name: {type: 'text', size: 10}
        };
    }

    static table():orm.Typed.TypedModel<IGraphd> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("Graphd", Graphd, {id: ["name"]});
        }
        return Table;
    }

}