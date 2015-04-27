
import orm = require("orm");
import store = require("../Storage");
import user = require("./User");
import device = require("./Device");

export interface ITicket extends Ticket, orm.Instance { }

export var Table: orm.Typed.TypedModel<ITicket> = undefined;

export class Ticket {

    uid: string = "";
    expire: number = 0;
    device_uid: string = "";
    owner_uid: string = "";
    owner: user.IUser;
    attributes: KVSet = {};
    accessTime: Date = new Date();

    static table(): orm.Typed.TypedModel<ITicket> {
        if (!Table) {
            Table = <any>store.DefineTable("Ticket", Ticket, { id: ["uid"] });

            Ticket.table()["hasOne"]('owner',
                user.User.table(),
                {
                    //reverse: "UserSessions",
                    required: true,
                    autoFetch: true
                });

            Ticket.table()["hasOne"]('device',
                device.Device.table(),
                {
                    //reverse: "UserSessions",
                    required: true, //CHANGE THIS
                    autoFetch: true
                });
        }
        return Table;
    }
}