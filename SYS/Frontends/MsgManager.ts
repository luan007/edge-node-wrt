import Message = require('../DB/Models/Message');
import Storage = require('../DB/Storage');

export class MessageConstant {
    static SYSTEM:string = 'SYSTEM';
    static ALL:string = 'ALL';
    static USER:string ='USER';
    static DEVICE:string = 'DEVICE';
}

export function QueryMessage(opts, cb) {
    opts.total = opts.total || 10;
    opts.page = opts.page || 1;
    var condition:{ [property: string]: any } = {};
    if (opts.source) condition['source'] = opts.source;
    if (opts.senderType) condition['senderType'] = opts.senderType;
    if (opts.sender) condition['sender'] = opts.sender;
    if (opts.receiverType) condition['receiverType'] = opts.receiverType;
    if (opts.receiver) condition['receiver'] = opts.receiver;
    if (opts.action) condition['action'] = opts.action;
    if (opts.hasOwnProperty("timeline")) condition['timeline'] = opts.timeline;
    if (opts.hasOwnProperty("notice")) condition['notice'] = opts.notice;
    if (opts.hasOwnProperty("read")) condition['read'] = opts.read;

    //console.log('---------- SQL total, page'['blueBG'].bold, opts.total, opts.page, JSON.stringify(condition));

    Message.Table.find(condition).limit(opts.total).offset((opts.page - 1) * opts.total).order('-sendTime').run((err, messages)=> {
        cb(err, messages);
    });
    
}

export function SendMessage(opts, cb) {
    trace(opts);
    if(opts.receivers) {
        for(var i = 0, len = opts.receivers.length; i < len ; i++) {
            var receiver = opts.receivers[i];
            var message = <any>{};
            message.uid = UUIDstr();
            message['receiver'] = receiver;
            message['source'] = opts.source || MessageConstant.SYSTEM;
            if (opts.senderType) message['senderType'] = opts.senderType;
            if (opts.sender) message['sender'] = opts.sender;
            if (opts.receiverTypes && opts.receiverTypes[i]) message['receiverType'] = opts.receiverTypes[i];
            if (opts.action) message['action'] = opts.action;
            if (opts.hasOwnProperty("timeline")) message['timeline'] = opts.timeline;
            if (opts.content) message['content'] = opts.content;
            if (opts.hasOwnProperty("notice")) message['notice'] = opts.notice;
            if (opts.hasOwnProperty("read")) message['read'] = opts.read;
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
    var SQL = 'UPDATE Message SET read = 1, readTime = date("now") WHERE uid in (' + params + ')'; // prevent-Injection
    Storage.Database.driver.execQuery(SQL, messageIDs, (err, data)=> {
        if (err) return cb(err);
        console.log('batch updating result: ', data);
        return cb();
    });
}

function __SendThunk(timeline:boolean, notice:boolean) {
    return function(action, content, sender, senderType, receivers:Array<string>, receiverTypes: Array<any>, source, cb:Callback){
        var opts:any = {};
        opts.action = action;
        opts.source = source;
        opts.sender = sender;
        opts.senderType = senderType;
        opts.content = content;
        opts.receivers = Array.isArray(receivers) ? receivers : [receivers];
        opts.receiverTypes = Array.isArray(receiverTypes) ? receiverTypes : [receiverTypes];
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

__API(Touch, "Message.Touch", [Permission.AnyApp]);
__API(__SendThunk(false, true), "Message.SendNotification", [Permission.AnyApp]);
__API(__SendThunk(true, false), "Message.SendTimeline", [Permission.AnyApp]);

__API(QueryMessage, "Message.RawQuery", [Permission.AnyApp]);
__API(__QueryThunk({timeline:true}), "Message.Timeline", [Permission.AnyApp]);
__API(__QueryThunk({notice:true}), "Message.GetNotifications", [Permission.AnyApp]);