import events = require('events');

export class Status extends events.EventEmitter {
    private eventName:string;

    constructor(eventName){
        super();

        this.eventName = eventName;
    }

    Emit = (...args) => {
        trace(args);
        var emit = this.emit.bind(null, this.eventName);
        emit(args);
    }

    Destory = () => {
        this.removeAllListeners();
    }
}