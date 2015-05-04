import events = require('events');
import _Status = require('./Status');
import Status = _Status.Status;

class StatMgr{
    private _statuses :{ [key: string]: Status; } = {};
    private _subBuffer : {[key: string]: Array<Function>} = {};
    private _moduleStatus : { [key:string]: any } = {};

    Pub = (k:string, m:string, desc?:string) => {
        this._statuses[k] = this._statuses[k] || new Status(k, m, desc);

        if(this._subBuffer[k]){ // for Sub buffer
            while(this._subBuffer[k].length > 0){
                var cb = this._subBuffer[k].pop();
                this._statuses[k].on(k, cb);
            }
            delete this._subBuffer[k];
            warn('Pub > 1');
        }

        this._statuses[k].on('statusChanged', (statusName, moduleName, obj) => { // status changed event.
            this._moduleStatus[moduleName] = this._moduleStatus[moduleName] || {};
            this._moduleStatus[moduleName][statusName] = this._moduleStatus[moduleName][statusName] || {};
            for(var k in obj)
                this._moduleStatus[moduleName][statusName][k] = obj[k];
        });

        return this._statuses[k];
    }

    Sub = (k:string, cb:Function) => {
        if(this._statuses[k]){
            this._statuses[k].on(k, cb);
        } else { // may be Sub before Pub
            warn('Sub > 1');
            this._subBuffer[k] = this._subBuffer[k] || [];
            this._subBuffer[k].push(cb);
        }
    }

    GetAll = ():{ [key:string]: IDic<Array<any>> } => {
        return this._moduleStatus;
    }

    GetByModule = (moduleName:string) => {
        return this._moduleStatus[moduleName];
    }

    Destory = () => {
        for(var k in this._statuses){
            this._statuses[k].Destory();
            delete this._statuses[k];
        }

        for(var k in this._subBuffer)
            delete this._subBuffer[k];

        for(var k in this._moduleStatus)
            for(var e in this._moduleStatus[k])
                delete this._moduleStatus[k][e];
    }
}

var statMgr = new StatMgr();
export = statMgr;
