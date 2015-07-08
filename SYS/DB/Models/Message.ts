import orm = require("orm");
import store = require("../Storage");

export interface IMessage extends Message, orm.Instance {
}

export var Table:orm.Typed.TypedModel<IMessage> = undefined;

export class Message {

    uid:string = "";
    senderType:string = "";         // enum: User|App|System ...
    sender:string = "";             // uid
    receiverType:string = "";       // enum: User|App ...
    receiver:string = "";           // [uid, uid, uid]
    action:string = "";             // e.g.  poke|send|share|ban
    content:string = "";            // JSON

    flash:boolean = false;
    timeline:boolean = false;
    notice:boolean = false;

    read:boolean = false;
    readTime:Date = new Date();
    sendTime:Date = new Date();

    static table():orm.Typed.TypedModel<IMessage> {
        if (!Table) {
            Table = <any>store.DefineTable("Message", Message, {id: ["uid"]});
        }
        return Table;
    }
}