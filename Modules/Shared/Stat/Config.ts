import events = require('events');
import ConfMgr = require('./ConfMgr');

export class Config extends events.EventEmitter {
    public key:string;
    public conf:any;

    constructor(key:string, conf:any) {
        super();

        this.key = key;
        this.conf = conf;
    }

    Flush = () => {
        ConfMgr.emit('flush', this.key);
    }

    Error = (err) => {
        if (error) error(err);
        else console.log(err);

    }

    Destory = () => {
        this.removeAllListeners();
    }
}