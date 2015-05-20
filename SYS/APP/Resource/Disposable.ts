//import events = require('events');
import ConfMgr = require('../../Common/Conf/ConfMgr');

export class Disposable{

    constructor(private moduleName:string, private appUid:string){
        //super();
    }

    Set = (conf:any) => {
        ConfMgr.AppSet(this.moduleName, this.appUid, conf);
        ConfMgr.Commit();
    }

    Dispose = () => {
        ConfMgr.AppShut(this.moduleName, this.appUid);
        ConfMgr.Commit();
    }
}