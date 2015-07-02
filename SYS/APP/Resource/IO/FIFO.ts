import RuntimePool = require('../../RuntimePool');
import AppManager = require('../../AppManager');

var TYPE_SOURCE = 0;
var TYPE_TARGET = 1;

var cbs = {};

function WaitTillConnected(fd, cb){
    var cur = RuntimePool.GetCallingRuntime(this);
    if(!cur) return cb(new Error('Who are you?'));
    if(!cur.IsRunning()) {
        return cb(new Error('Not running'));
    }
    if(!FIFO.all[fd] || FIFO.all[fd].type !== TYPE_SOURCE) return cb(new Error('Source is not valid'));
    if(FIFO.all[fd].link) return cb();

    if(!cbs[fd])
        cbs[fd] = [];
    cbs[fd].push(fd);
}

function Writeable(cb) {
    var cur = RuntimePool.GetCallingRuntime(this);
    if(!cur) return cb(new Error('Who are you?'));
    if(!cur.IsRunning()) {
        return cb(new Error('Not running'));
    }
    FIFO.DeploySource(cur.RuntimeId, AppManager.GetAppSharedIODir(cur.App.uid), (err, result)=>{
        if(err) return cb(err);
        else{
            return cb(undefined, "/Share/IO/" + result);
        }
    });
}

function Readable(remotefd, cb) {
    var cur = RuntimePool.GetCallingRuntime(this);
    if(!cur) return cb(new Error('Who are you?'));
    if(!cur.IsRunning()) {
        return cb(new Error('Not running'));
    }
    if(!FIFO.all[remotefd]) return cb(new Error('Target is not valid'));
    if(FIFO.all[remotefd].link) return cb(new Error('Target already consumed'));

    if(!cbs[remotefd] || cbs[remotefd].length === 0){
        //warning, remote may not be listening
    }

    FIFO.DeployTarget(cur.RuntimeId, AppManager.GetAppSharedIODir(cur.App.uid), (err, name)=>{
        if (err) return cb(err);
        FIFO.Link(remotefd, name, (err) => {
            if(err) return cb(err);
            cb(undefined, "/Share/IO" + name);

            while(Array.isArray(cbs) && cbs[remotefd].length){
                (cbs[remotefd].pop())();
            }
            delete cbs[remotefd];
        });
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


__API(WaitTillConnected, "API.IO.OnFDConnect", [Permission.IO]);
__API(Writeable, "API.IO.CreateFD", [Permission.IO]);
__API(Readable, "API.IO.ReadFD", [Permission.IO]);

//API.IO.CreateFD((err, fd)=>{
//
//    API.IO.OnFDConnect(fd, ()=>{
//        //pipe
//    });
//
//    API.Driver.Invoke();
//
//});
