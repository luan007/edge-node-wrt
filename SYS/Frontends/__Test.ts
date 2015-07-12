import MsgManager = require('./MsgManager');
import MessageConstant = MsgManager.MessageConstant;
import Message = require('../DB/Models/Message');

export function Initialize(cb){
    var uuid = UUIDstr();

    MsgManager.SendMessage({
        source: MessageConstant.SYSTEM,
        receiverType: MessageConstant.USER,
        receivers: [uuid],
        action: 'poke',
        content: 'Aloha!',
        timeline: false,
        notice: true
    }, (err)=>{
        if(err) return console.log(err.message['redBG'].bold);
        var condition:{ [property: string]: any } = {receiver: uuid};

        MsgManager.QueryMessage(condition, (err, messages)=>{
            if(err) return console.log(err.message['redBG'].bold);
            console.log('▂▃▅▆█ messages'['blueBG'], JSON.stringify(messages));
        });
    });
    cb();
}