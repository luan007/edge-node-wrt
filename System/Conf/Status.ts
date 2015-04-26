import events = require('events');

export class Status extends events.EventEmitter {
    private eventName:string;
    private description:string;

    constructor(eventName:string, description?:string) {
        super();

        this.eventName = eventName;
        this.description = description || '';
    }

    Emit = (...args) => {
        this.emit.apply(this, [this.eventName].concat(args));
    }

    Destory = () => {
        this.removeAllListeners();
    }
}