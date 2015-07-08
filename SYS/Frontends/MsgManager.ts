import Message = require('../DB/Models/Message');
import Storage = require('../DB/Storage');

export class MessageConstant {
    static SYSTEM:string = 'System';
    static ALL:string = 'ALL';
}

export function QueryMessage(opts, cb) {
    opts.total = opts.total || 10;
    opts.page = opts.page || 1;
    var condition:{ [property: string]: any } = {};
    condition['source'] = opts.source || MessageConstant.SYSTEM;
    if (opts.senderType) condition['senderType'] = opts.senderType;
    if (opts.sender) condition['sender'] = opts.sender;
    if (opts.receiverType) condition['receiverType'] = opts.receiverType;
    if (opts.receiver) condition['receiver'] = opts.receiver;
    if (opts.action) condition['action'] = opts.action;
    if (opts.timeline) condition['timeline'] = opts.timeline;
    if (opts.notice) condition['notice'] = opts.notice;
    if (opts.read) condition['read'] = opts.read;

    Message.Table.find(condition).limit(opts.total).offset((opts.page - 1) * opts.total).order('-sendTime').run((err, messages)=> {
        cb(err, messages);
    });
}

export function SendMessage(opts, cb) {
    if(opts.receivers) {
        for(var i = 0, len = opts.receivers.length; i< len ; i++) {
            var receiver = opts.receivers[i];
            var message = <any>{};
            message.uid = UUIDstr();
            message['receiver'] = receiver;
            if (opts.senderType) message['senderType'] = opts.senderType;
            if (opts.sender) message['sender'] = opts.sender;
            if (opts.receiverType) message['receiverType'] = opts.receiverType;
            if (opts.action) message['action'] = opts.action;
            if (opts.timeline) message['timeline'] = opts.timeline;
            if (opts.notice) message['notice'] = opts.notice;
            if (opts.read) message['read'] = opts.read;
            message['sendTime'] = new Date();

            Message.Table.create(message, (err)=> {
                if (err) return cb(err);
                return cb();
            });
        }
    } else
        return cb(new Error('receivers must be a Array.'));
}

export function Touch(messageIDs:Array<string>, cb:Callback) {
    var params = messageIDs.map((id)=> {
        return '?';
    }).join(',');
    var SQL = 'UPDATE Message SET read = 1, readTime = date("now"") WHERE uid in (' + params + ')'; // prevent-Injection
    Storage.Database.driver.execQuery(SQL, messageIDs, (err, data)=> {
        if (err) return cb(err);
        console.log('batch updating result: ', data);
        return cb();
    });
}

function __SendThunk(timeline:boolean, notice:boolean) {
    return function(action, source, sender, senderType, receivers:Array<string>, receiverType, cb:Callback){
        var opts:any = {};
        opts.action = action;
        opts.source = source;
        opts.sender = sender;
        opts.senderType = senderType;
        opts.receivers = receivers;
        opts.receiverType = receiverType;
        opts.timeline = timeline;
        opts.notice = notice;
        opts.read = false;
        return SendMessage(opts, cb);
    };
}

function __QueryThunk(condition) {
    return (receiver, receiverType, page:number, total:number, cb:Callback)=>{
        var opts:any = {};
        opts.receiver = receiver;
        opts.receiverType = receiverType;
        opts.page = page;
        opts.total = total;
        if(condition.hasOwnProperty('timeline')) opts.timeline = condition.timeline;
        if(condition.hasOwnProperty('notice')) opts.notice = condition.notice;
        if(condition.hasOwnProperty('source')) opts.source = condition.source;
        opts.read = false;
        return QueryMessage(opts, cb);
    };
}

__API(Touch, "Message.Read", [Permission.AnyApp]);
__API(__SendThunk(false, true), "Message.SendNotificaiton", [Permission.AnyApp]);
__API(__SendThunk(true, false), "Message.SendTimeline", [Permission.AnyApp]);

__API(__QueryThunk({timeline:true}), "Message.Timeline", [Permission.AnyApp]);
__API(__QueryThunk({notice:true}), "Message.Notification", [Permission.AnyApp]);