import ResourceMgr = require('./ResourceMgr');
import _Disposable = require('./Disposable');
import Disposable = _Disposable.Disposable;
import Recycle = _Disposable.Recycle;

var disposable:Disposable;
var appUid = 'testAPP';
var recycle:Recycle;

function Install() {
    disposable = ResourceMgr.Register(appUid, SECTION.NETWORK);
    recycle = (moduleName:string, appUid:string, conf:any) => {
        
    }

    var conf = {};
    conf[appUid] = {
        Hosts: {
            'wi.fi': '192.168.1.1'
        }
    };
    disposable.Set(conf, recycle)
}

function Uninstall() {
    disposable.Dispose();
}

// In network:
//if (has(delta, "testAPP")) {
//    var hosts = delta['testAPP']['Hosts'];
//    dnsmasq.Hosts['testAPP']["wi.fi"] = hosts['wi.fi'];
//}