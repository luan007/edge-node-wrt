import _StatNode = require('./StatNode');
import StatNode = _StatNode.StatNode;

class StatMgr {
    private _statuses:{ [key: string]: StatNode; } = {};

    Pub = (k:string, statusObject:Object):any => {
        this._statuses[k] = new StatNode(k, statusObject);
        return this._statuses[k];
    }

    Sub = (k:string):any => {
        if(this._statuses[k])
            return this._statuses[k];
        else
            throw new Error(k + ' did not yet exist.');
    }

    Get = (k:string):any => {
        return this._statuses[k];
    }
}

var statMgr = new StatMgr();
export = statMgr;