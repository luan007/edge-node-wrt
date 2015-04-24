import fs = require('fs');
import events = require('events');
import _Status = require('./Status');
import Status = _Status.Status;

var CONFIG_PATH = "/var/status";

class ConfMgr extends events.EventEmitter {
    private _statusCollection:{ [key: string]: Status; } = {};

    constructor() {
        super();
    }

    Set = (k:string, v:Status) => {
        var args:Array<any> = [k];
        if (this._statusCollection[k]) {
            if(this._statusCollection[k].Equal(v))
                return;
            args.push(this._statusCollection[k]);
        }
        args.push(v.value);
        this._statusCollection[k] = v;
        this.emit.apply(null, args);
        this._save();
    };

    Delete = (k:string) => {
        if (this._statusCollection[k]) {
            this.emit.apply(null, [k, this._statusCollection[k]]);
            delete this._statusCollection[k];
            this._save();
        }
    }

    /**
     * (Re)Loads Config from DB
     */
    Initialize = () => {
        this._load();
    }

    Destory = () => {
        this.removeAllListeners();
    }

    private _save = () => {
        fs.writeFile(CONFIG_PATH, JSON.stringify(this._statusCollection), (err)=> {
            if (err) console.log(err);
        });
    }

    private _load = () => {
        var data = fs.readFileSync(CONFIG_PATH);
        this._statusCollection = JSON.parse(data.toString('utf8'));
    }
}

var _ConfMgr = new ConfMgr();
export = _ConfMgr;
