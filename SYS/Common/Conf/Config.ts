import events = require('events');

export class Config extends events.EventEmitter {
    public key:string;
    //public conf:any;

    constructor(key:string) {
        super();

        this.key = key;
        //this.conf = conf;
    }

    Flush = () => {
        require('./ConfMgr').emit('flush', this.key);
    }

    Get = () => {
        var conf =  require('./ConfMgr').Get(this.key);
        return conf;
    }

    LoadFromCfgFile = () => {
        require('./ConfMgr').Load(this.key);
    }

    Error = (err) => {
        if (error) error(err);
        else console.log(err);
    }

    Destory = () => {
        this.removeAllListeners();
    }
}