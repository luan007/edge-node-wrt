import _Status = require('./Status');
import Status = _Status.Status;

class StatMgr{
    private _statuses :{ [key: string]: Status; } = {};
    private _subBuffer : {[key: string]: Array<Function>} = {};

    Pub = (k:string, desc?:string) => {
        this._statuses[k] = this._statuses[k] || new Status(k, desc);

        if(this._subBuffer[k]){ // for Sub buffer
            while(this._subBuffer[k].length > 0){
                var cb = this._subBuffer[k].pop();
                this._statuses[k].on(k, cb);
            }
            delete this._subBuffer[k];
        }

        return this._statuses[k];
    }

    Sub = (k:string, cb:Function) => {
        if(this._statuses[k]){
            this._statuses[k].on(k, cb);
        } else { // may be Sub before Pub
            this._subBuffer[k] = this._subBuffer[k] || [];
            this._subBuffer[k].push(cb);
        }
    }

    Destory = () => {
        for(var k in this._statuses){
            this._statuses[k].Destory();
            delete this._statuses[k];
        }
        for(var k in this._subBuffer)
            delete this._subBuffer[k];
    }
}

var statMgr = new StatMgr();
export = statMgr;
