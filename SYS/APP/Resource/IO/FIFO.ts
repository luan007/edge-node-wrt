import RuntimePool = require('../../RuntimePool');
import AppManager = require('../../AppManager');

function Writeable(cb) {
    var cur = RuntimePool.GetCallingRuntime(this);
    if(!cur) return cb(new Error('Who are you?'));
    if(!cur.IsRunning()) {
        return cb(new Error('Not running'));
    }
    FIFO.CreateSource(cur.RuntimeId, AppManager.GetAppSharedIODir(cur.App.uid), (err, result)=>{
        if(err) return cb(err);
        else{
            return cb(undefined, result);
        }
    });
}

function Readable(remotefd, cb) {
    var cur = RuntimePool.GetCallingRuntime(this);
    if(!cur) return cb(new Error('Who are you?'));
    if(!cur.IsRunning()) {
        return cb(new Error('Not running'));
    }
    FIFO.CreatePipedTarget(cur.RuntimeId, AppManager.GetAppSharedIODir(cur.App.uid), remotefd, (err, name)=>{
        if(err) return cb(err);
        cb(undefined, "/Share/IO" + name);
    });
}

function _cleanUp(runtimeId){
    FIFO.ReleaseByOwner(runtimeId);
}

export function Subscribe(cb){

    var runtime = StatMgr.Sub(SECTION.RUNTIME);
    runtime.apps.on('set', (_key, _old, _new) => {
        if(_new.State < 0) {
            _cleanUp(_new.RuntimeId);
        }
    });
    cb();
 
}


__API(Writeable, "API.IO.CreateFD", [Permission.IO]);
__API(Readable, "API.IO.ReadFD", [Permission.IO]);
