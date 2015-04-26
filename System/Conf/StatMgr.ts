import _Status = require('./Status');
import Status = _Status.Status;

class StatMgr{
    private _statuses :{ [key: string]: Status; } = {};

    Pub = (k:string) => {
        this._statuses[k] = this._statuses[k] || new Status(k);
        return this._statuses[k];
    }

    Sub = (k:string, cb:Function) => {
        if(this._statuses[k]){
            this._statuses[k].on(k, cb);
        }
    }

    Destory = () => {
        for(var k in this._statuses)
            this._statuses[k].Destory();
    }
}

var statMgr = new StatMgr();
export = statMgr;
