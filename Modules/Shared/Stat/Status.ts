import events = require('events');
import StatusMgr = require('./StatusMgr');
import ConfMgr = require('./ConfMgr');

export class Status {
    public key:string;
    public value:any;

    constructor(key:string, val?:Status) {
        this.key = key;
        if (val) this.Set(val);
    }

    Set = (newValue) => {
        this.value = newValue;
        ConfMgr.Set(this.key, this);
    }

    Change = (newValue?) => {
        if(newValue) this.value = newValue;
        StatusMgr.Set(this.key, this);
    }

    Equal = (target:Status) => {
        return JSON.stringify(this.value) == JSON.stringify(target.value);
    }
}