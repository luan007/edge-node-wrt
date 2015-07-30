eval(LOG("APP:Resource:AppConfig"));

import ConfMgr = require('../../Common/Conf/ConfMgr');

export function Set(moduleName:string, runtimeId:string, conf:any, cb){
    if(ConfMgr.AppSet(moduleName, runtimeId, conf))
        ConfMgr.CommitByAPP(moduleName, cb);
    else
        cb(new Error('Invalid Section Name: ' + moduleName));
}

export function Revoke (moduleName:string, runtimeId:string, cb){
    ConfMgr.AppRevoke(moduleName, runtimeId, cb);
    //ConfMgr.CommitByAPP(moduleName, cb);
}

function _cleanUp(runtimeId){
    for(var i in SECTION) {
        ConfMgr.AppRevoke(SECTION[i], runtimeId, ()=>{});
    }
}

export function Subscribe(cb) {
    var runtime = StatMgr.Sub(SECTION.RUNTIME);
    runtime.apps.on('set', (_key, _old, _new) => {
        if (_new.State < 0) {
            _cleanUp(_new.RuntimeId);
        }
    });
    cb();
}