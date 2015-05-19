//import events = require('events');
import ConfMgr = require('../../Common/Conf/ConfMgr');

export interface Recycle{
    (moduleName:string, appUid:string, conf:any): any;
}

export class Disposable{
    private conf;
    private recycle: Recycle;

    constructor(private moduleName:string, private appUid:string){
        //super();
    }

    Set = (conf:any, recycle:Recycle) => {
        this.conf = conf;
        this.recycle = recycle;
        ConfMgr.AppSet(this.moduleName, this.appUid, this.conf);
        ConfMgr.Commit();
    }

    Dispose = () => {
        this.recycle(this.appUid, this.moduleName, this.conf);
    }
}