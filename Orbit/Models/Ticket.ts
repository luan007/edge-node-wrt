
import orm = require("orm");
import store = require("../Storage");
import user = require("./User");
import router = require("./Router");
import device = require("./Device");

export interface ITicket extends Ticket, orm.Instance { }

export var Table: orm.Typed.TypedModel<ITicket> = undefined;

export class Ticket {

    uid: string = "";
    refreshToken: string = "";
    refreshSalt: string = "";
    expire: number = 0;
    device_uid: string = ""; //TBD
    //type: number = 0; //reserved
    owner_uid: string = "";
    router_uid: string = "";
    owner: user.IUser;
    router: router.IRouter;
    attributes: KVSet = {};
    accessTime: Date = new Date();

    static table(): orm.Model {
        if (!Table) {
            var db = store.Database;
            Table = <any>store.DefineTable("Ticket", Ticket, { id: ["uid"] });

            Ticket.table()["hasOne"]('owner',
                user.User.table(),
                {
                    //reverse: "UserSessions",
                    required: true,
                    autoFetch: true
                });

            Ticket.table()["hasOne"]('router',
                router.Router.table(),
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