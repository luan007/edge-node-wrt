import orm = require("orm");
import store = require("../Storage");

export interface IDevice extends Device, orm.Instance { }
export var Table: orm.Typed.TypedModel<IDevice> = undefined; //YOU HAVE TO SET THIS MAN


//TODO: Sync Device
export class Device {

    uid: string = "";
    //assumptions: IDic<IDeviceAssumption> = {};
    hwaddr: string = ""; //<-- not gonna change
    busname: string = "";
    //busdata: KVSet = {};
    //state: number = 0;
    //time: Date = new Date();
    router_uid: string = "";
    local_dev_uid: string = "";
    accessTime: Date = new Date();
    updateTime: Date = new Date();
    attributes: KVSet = {};

    static meta() {
        return {
            uid: {type: 'text', size: 255 }
        };
    }

    static table(): orm.Typed.TypedModel<IDevice> {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("Device", Device, { id: ["uid"] });
            Table["hasOne"]('router',
                store.Models.Router.Router.table(),
                {
                    //reverse: "UserSessions",
                    required: true,
                    autoFetch: true
                });
        }
        return Table;
    }

}