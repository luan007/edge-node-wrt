import ConfMgr = require('../../Common/Conf/ConfMgr');

export function Set(moduleName:string, appUid:string, conf:any, cb){
    ConfMgr.AppSet(moduleName, appUid, conf);
    ConfMgr.CommitByAPP(moduleName, cb);
}

export function Shut (moduleName:string, appUid:string, cb){
    ConfMgr.AppShut(moduleName, appUid, cb);
    //ConfMgr.CommitByAPP(moduleName, cb);
}
