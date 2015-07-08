import Message = require('../DB/Models/Message');
import Storage = require('../DB/Storage');

export function QueryMessage(opts, cb) {
    opts.total = opts.total || 10;
    opts.page = opts.page || 1;
    var condition:{ [property: string]: any } = {};
    if (opts.senderType) condition['senderType'] = opts.senderType;
    if (opts.sender) condition['sender'] = opts.sender;
    if (opts.receiverType) condition['receiverType'] = opts.receiverType;
    if (opts.receiver) condition['receiver'] = opts.receiver;
    if (opts.action) condition['action'] = opts.action;
    if (opts.flash) condition['flash'] = opts.flash;
    if (opts.timeline) condition['timeline'] = opts.timeline;
    if (opts.notice) condition['notice'] = opts.notice;
    if (opts.read) condition['read'] = opts.read;

    Message.Table.find(condition).limit(opts.total).offset((opts.page - 1) * opts.total).order('-sendtime').run((err, messages)=> {
        cb(err, messages);
    });
}

export function SendMessage(opts, cb) {
    var message = <any>{};
    message.uid = UUIDstr();
    if (opts.senderType) message['senderType'] = opts.senderType;
    if (opts.sender) message['sender'] = opts.sender;
    if (opts.receiverType) message['receiverType'] = opts.receiverType;
    if (opts.receiver) message['receiver'] = opts.receiver;
    if (opts.action) message['action'] = opts.action;
    if (opts.flash) message['flash'] = opts.flash;
    if (opts.timeline) message['timeline'] = opts.timeline;
    if (opts.notice) message['notice'] = opts.notice;
    if (opts.read) message['read'] = opts.read;
    message['sendTime'] = new Date();

    Message.Table.create(message, (err)=> {
        if (err) return cb(err);
        return cb();
    });
}

export function Touch(messageIDs:Array<string>, cb) {
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

__API(Touch, "Message.Read", [Permission.AnyApp]);
__API(()=>{}, "Message.SendFlash", [Permission.AnyApp]);