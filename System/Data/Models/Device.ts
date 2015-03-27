import orm = require("orm");
import store = require("../Storage");

export interface IDevice extends Device, orm.Instance { }
export var Table: orm.Typed.TypedModel<IDevice> = undefined; //YOU HAVE TO SET THIS MAN

export class Device {

    uid: string = "";
    assumptions: IDic<IDeviceAssumption> = {};
    hwaddr: string = "";
    busname: string = "";
    busdata: KVSet = {};
    state: number = 0;
    time: Date = new Date();
    config: KVSet = {};
    ownership: string = "";
    static table(): orm.Typed.TypedModel<IDevice> {
        if (!Table) {
            Table = <any>store.DefineTable("Device", Device, { id: ["uid"] });
        }
        return Table;
    }

}