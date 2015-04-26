import events = require('events');

export class Status extends events.EventEmitter {
    private eventName:string;

    constructor(eventName){
        super();

        this.eventName = eventName;
    }

    Emit = (...args) => {
        this.emit.apply(this, [this.eventName].concat(args));
    }

    Destory = () => {
        this.removeAllListeners();
    }
}