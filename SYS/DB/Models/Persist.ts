import orm = require("orm");
import store = require("../Storage");

export interface IPersist extends Persist, orm.Instance {
}

export var Table:orm.Typed.TypedModel<IPersist> = undefined;

export class Persist {

    uid: string = ""; //le key
	
	data: string = ""; //le val
    
	static table():orm.Typed.TypedModel<IPersist> {
        if (!Table) {
            Table = <any>store.DefineTable("Persist", Persist, {id: ["uid"]});
        }
        return Table;
    }
}