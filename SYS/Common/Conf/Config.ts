import events = require('events');

export class Config extends events.EventEmitter {
    public key:string;
    public conf:any;

    constructor(key:string, conf:any) {
        super();

        this.key = key;
        this.conf = conf;
    }

    Flush = () => {
        require('./ConfMgr').emit('flush', this.key);
    }

    Get = () => {
        return require('./ConfMgr').Get(this.key);
    }

    Error = (err) => {
        if (error) error(err);
        else console.log(err);
    }

    Destory = () => {
        this.removeAllListeners();
    }
}