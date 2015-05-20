import ResourceMgr = require('./ResourceMgr');
import _Disposable = require('./Disposable');
import Disposable = _Disposable.Disposable;

var disposable:Disposable;
var appUid = 'testAPP';

function Install() {
    disposable = ResourceMgr.Register(appUid, SECTION.NETWORK);

    var conf = {
        Hosts: {
            'wi.fi': '192.168.1.1'
        }
    };
    disposable.Set(conf)
}

export function Initialize(cb) {
    Install();
    setTimeout(() => {
        disposable.Dispose();
        cb();
    }, 2000);

}

// In network:
//if (has(delta, "testAPP")) {
//    var hosts = delta['testAPP']['Hosts'];
//    dnsmasq.Hosts['testAPP']["wi.fi"] = hosts['wi.fi'];
//}