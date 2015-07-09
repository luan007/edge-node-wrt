import orm = require("orm");
import store = require("../Storage");

export interface ITraffic extends Traffic, orm.Instance { }

export var Table: orm.Typed.TypedModel<ITraffic> = undefined; //YOU HAVE TO SET THIS MAN

export class Traffic {

    uid: string = "";
    internet_up_pkts : number = 0;
    internet_up_bytes : number = 0;
    internet_down_pkts : number = 0;
    internet_down_bytes : number = 0;
    intranet_up_pkts : number = 0;
    intranet_up_bytes : number = 0;
    intranet_down_pkts : number = 0;
    intranet_down_bytes : number = 0;

    static table(): orm.Typed.TypedModel<ITraffic> {
        if (!Table) {
            Table = <any>store.DefineTable("Traffic", Traffic, { id: ["uid"] });
        }
        return Table;
    }

}