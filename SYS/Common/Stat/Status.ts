import events = require('events');

export class Status extends events.EventEmitter {
    private statusName:string;
    private description:string;
    private moduleName:string;

    constructor(eventName:string, moduleName:string, description?:string) {
        super();

        this.statusName = eventName;
        this.moduleName = moduleName;
        this.description = description || '';
    }

    Emit = (obj) => {
        var args2 = [this.statusName, this.moduleName, obj];
        this.emit.apply(this, args2);
        this.emit.apply(this, ['statusChanged'].concat(args2));
    }

    Destory = () => {
        this.removeAllListeners();
    }
}